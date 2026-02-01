import http.server
import json
import os
import socketserver
import traceback
import webbrowser
from pathlib import Path

PORT = 8000
ROOT = Path(__file__).parent


class QEMZooHandler(http.server.SimpleHTTPRequestHandler):
    """Serves static files and handles /api/run for the playground."""

    def do_POST(self):
        if self.path == "/api/run":
            self._handle_run()
        else:
            self.send_error(404)

    def _send_json(self, code, data):
        body = json.dumps(data).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _handle_run(self):
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = json.loads(self.rfile.read(length))

            circuit_id = body.get("circuit")
            techniques = body.get("techniques", [])
            shots = body.get("shots", 10000)
            noise_level = body.get("noise_level", 0.01)

            print(f"[API] Running simulation: circuit={circuit_id}, "
                  f"techniques={[t['name'] for t in techniques]}, "
                  f"noise={noise_level}, shots={shots}")

            result = run_simulation(circuit_id, techniques, shots, noise_level)

            print(f"[API] Result: ideal={result['ideal_value']:.4f}, "
                  f"noisy={result['noisy_value']:.4f}, "
                  f"mitigated={result['mitigated_value']:.4f}")

            self._send_json(200, result)
        except Exception as e:
            traceback.print_exc()
            self._send_json(500, {"error": str(e)})

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def log_message(self, format, *args):
        msg = format % args
        if "/api/" in msg or "404" in msg or "500" in msg:
            super().log_message(format, *args)


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True


def run_simulation(circuit_id, techniques, shots, noise_level):
    """Run a noisy shot-based simulation and apply composed QEM techniques."""
    import numpy as np

    from cirq import (
        DensityMatrixSimulator,
        LineQubit,
        Z,
        depolarize,
    )
    from mitiq import zne
    from mitiq.zne.inference import (
        ExpFactory,
        LinearFactory,
        RichardsonFactory,
    )
    from mitiq.zne.scaling import fold_global
    from mitiq import ddd as mitiq_ddd
    from mitiq import rem as mitiq_rem

    # Load circuit manifest.
    manifest_path = ROOT / "circuits" / "manifest.json"
    with open(manifest_path) as f:
        manifest = json.load(f)

    circuit_meta = next((c for c in manifest if c["id"] == circuit_id), None)
    if circuit_meta is None:
        raise ValueError(f"Unknown circuit: {circuit_id}")

    ideal_value = circuit_meta["ideal_value"]
    n_qubits = circuit_meta["qubits"]

    qubits = LineQubit.range(n_qubits)
    circuit = _build_circuit(circuit_id, qubits)

    noise_model = depolarize(p=noise_level)

    # Shot-based executor: samples `shots` bitstrings and computes <Z...Z>.
    # This is stochastic — different results each run.
    def base_executor(circ):
        noisy = circ.with_noise(noise_model)
        sim = DensityMatrixSimulator()
        result = sim.simulate(noisy)
        rho = result.final_density_matrix

        # Sample bitstrings from the density matrix.
        probs = np.real(np.diag(rho))
        probs = np.abs(probs)
        probs /= probs.sum()
        samples = np.random.choice(len(probs), size=shots, p=probs)

        # Compute <Z^n> from samples: each bitstring contributes (-1)^(parity).
        exp_val = 0.0
        for s in samples:
            parity = bin(s).count("1") % 2
            exp_val += (-1) ** parity
        exp_val /= shots
        return float(exp_val)

    # Get noisy value (no mitigation).
    noisy_value = base_executor(circuit)

    # Compose techniques by nesting executors and/or modifying the circuit.
    # The user's technique list is applied in order (first = innermost).
    # Circuit-level transforms (DD, PT) modify the circuit.
    # Executor-level transforms (ZNE, REM) wrap the executor.
    composed_circuit = circuit
    composed_executor = base_executor
    applied_techniques = []

    for tech in techniques:
        name = tech.get("name", "")
        params = tech.get("params", {})

        if name == "zne":
            scale_factors = params.get("scale_factors", [1, 3, 5])
            if isinstance(scale_factors, str):
                scale_factors = [float(s.strip()) for s in scale_factors.split(",")]
            scale_factors = [float(s) for s in scale_factors]

            extrapolation = params.get("extrapolation", "richardson")

            if extrapolation == "linear":
                factory = LinearFactory(scale_factors=scale_factors)
            elif extrapolation == "exponential":
                factory = ExpFactory(scale_factors=scale_factors)
            else:
                factory = RichardsonFactory(scale_factors=scale_factors)

            # Wrap the current executor with ZNE.
            prev_executor = composed_executor
            composed_executor = zne.mitigate_executor(
                prev_executor,
                factory=factory,
                scale_noise=fold_global,
            )
            applied_techniques.append(name)

        elif name == "ddd":
            rule_name = params.get("rule", "xx")
            rule_map = {
                "xx": mitiq_ddd.rules.xx,
                "xyxy": mitiq_ddd.rules.xyxy,
                "yy": mitiq_ddd.rules.yy,
            }
            rule = rule_map.get(rule_name, mitiq_ddd.rules.xx)
            # DDD is a circuit-level transform: insert DD sequences.
            composed_circuit = mitiq_ddd.insert_ddd_sequences(
                composed_circuit, rule=rule
            )
            applied_techniques.append(name)

        elif name == "rem":
            # REM: apply inverse confusion matrix to the probability
            # distribution before computing the expectation value.
            # Use the noise level as symmetric bit-flip probability.
            icm = mitiq_rem.generate_inverse_confusion_matrix(
                n_qubits, p0=noise_level, p1=noise_level
            )
            prev_executor = composed_executor

            def _make_rem_executor(inner_exec, inv_cm, n_q, n_shots):
                def rem_executor(circ):
                    # Run circuit, get noisy probabilities via sampling.
                    noisy = circ.with_noise(noise_model)
                    sim = DensityMatrixSimulator()
                    result = sim.simulate(noisy)
                    rho = result.final_density_matrix
                    probs = np.real(np.diag(rho))
                    probs = np.abs(probs)
                    probs /= probs.sum()
                    n_states = len(probs)
                    samples = np.random.choice(n_states, size=n_shots, p=probs)
                    counts = np.bincount(samples, minlength=n_states)
                    noisy_probs = counts / counts.sum()

                    # Apply inverse confusion matrix to correct probabilities.
                    corrected_probs = inv_cm @ noisy_probs
                    # Clip negatives (can arise from inversion).
                    corrected_probs = np.clip(corrected_probs, 0, None)
                    corrected_probs /= corrected_probs.sum()

                    # Compute <Z^n> from corrected distribution.
                    exp_val = 0.0
                    for i, p in enumerate(corrected_probs):
                        parity = bin(i).count("1") % 2
                        exp_val += ((-1) ** parity) * p
                    return float(exp_val)
                return rem_executor

            composed_executor = _make_rem_executor(
                prev_executor, icm, n_qubits, shots
            )
            applied_techniques.append(name)

    # Run the fully composed pipeline.
    mitigated_value = float(composed_executor(composed_circuit))

    return {
        "ideal_value": ideal_value,
        "noisy_value": noisy_value,
        "mitigated_value": mitigated_value,
        "techniques_applied": applied_techniques,
    }


def _build_circuit(circuit_id, qubits):
    """Build a Cirq circuit for the given circuit ID."""
    from cirq import CNOT, H, T, Circuit

    if circuit_id == "bell_state":
        return Circuit([H(qubits[0]), CNOT(qubits[0], qubits[1])])

    elif circuit_id == "ghz_3qubit":
        return Circuit([
            H(qubits[0]),
            CNOT(qubits[0], qubits[1]),
            CNOT(qubits[1], qubits[2]),
        ])

    elif circuit_id == "mirror_2qubit":
        return Circuit([
            H(qubits[0]),
            CNOT(qubits[0], qubits[1]),
            T(qubits[0]),
            T(qubits[1]),
            T(qubits[1]) ** -1,
            T(qubits[0]) ** -1,
            CNOT(qubits[0], qubits[1]),
            H(qubits[0]),
        ])

    elif circuit_id == "random_1qubit":
        return Circuit([H(qubits[0]), T(qubits[0]), H(qubits[0])])

    else:
        raise ValueError(f"Unknown circuit: {circuit_id}")


def main():
    os.chdir(ROOT)
    httpd = ThreadingHTTPServer(("", PORT), QEMZooHandler)
    print(f"Serving QEM Zoo at http://localhost:{PORT}")
    webbrowser.open(f"http://localhost:{PORT}")
    httpd.serve_forever()


if __name__ == "__main__":
    main()
