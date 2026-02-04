#!/usr/bin/env python3
"""
Generate circuit diagrams for QEM Zoo noise scaling techniques.

Requires:
    pip install qiskit matplotlib

Optional (for circuit unoptimization examples):
    pip install circuit-unoptimization
    # or: uv pip install git+https://github.com/unitaryfoundation/circuit-unoptimization

Usage:
    python scripts/generate_circuit_diagrams.py
"""

import os
from pathlib import Path

# Ensure output directory exists
OUTPUT_DIR = Path(__file__).parent.parent / "images" / "circuits"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def save_circuit(circuit, filename, title=None):
    """Save a circuit diagram as SVG."""
    import matplotlib.pyplot as plt
    from qiskit.visualization import circuit_drawer

    fig = circuit_drawer(
        circuit,
        output="mpl",
        style="iqp",
        fold=-1  # Don't fold long circuits
    )

    # Add title if provided
    if title:
        fig.suptitle(title, fontsize=12, y=1.02)

    filepath = OUTPUT_DIR / f"{filename}.svg"
    fig.savefig(filepath, format="svg", bbox_inches="tight", transparent=True)
    plt.close(fig)
    print(f"Saved: {filepath}")
    return filepath


def generate_folding_examples():
    """Generate unitary folding circuit diagrams."""
    from qiskit import QuantumCircuit

    # Original simple circuit
    original = QuantumCircuit(2, name="Original")
    original.h(0)
    original.cx(0, 1)
    original.rz(0.5, 1)

    save_circuit(original, "folding_original", "Original Circuit")

    # Global folding (λ = 3): U → U U† U
    global_fold = QuantumCircuit(2, name="Global Fold λ=3")
    # U
    global_fold.h(0)
    global_fold.cx(0, 1)
    global_fold.rz(0.5, 1)
    global_fold.barrier(label="U")
    # U†
    global_fold.rz(-0.5, 1)
    global_fold.cx(0, 1)
    global_fold.h(0)
    global_fold.barrier(label="U†")
    # U
    global_fold.h(0)
    global_fold.cx(0, 1)
    global_fold.rz(0.5, 1)
    global_fold.barrier(label="U")

    save_circuit(global_fold, "folding_global_lambda3", "Global Folding (λ=3): U U† U")

    # Local folding - fold only the CNOT gate
    local_fold = QuantumCircuit(2, name="Local Fold (CNOT only)")
    local_fold.h(0)
    local_fold.barrier()
    # CNOT → CNOT CNOT† CNOT = CNOT CNOT CNOT (since CNOT is self-inverse)
    local_fold.cx(0, 1)
    local_fold.cx(0, 1)
    local_fold.cx(0, 1)
    local_fold.barrier()
    local_fold.rz(0.5, 1)

    save_circuit(local_fold, "folding_local_cnot", "Local Folding (CNOT only): G G† G")

    # Show the G → G G† G transformation explicitly for a single gate
    single_gate = QuantumCircuit(1, name="Single Gate")
    single_gate.h(0)
    save_circuit(single_gate, "folding_single_before", "Before: G")

    single_folded = QuantumCircuit(1, name="Folded Gate")
    single_folded.h(0)
    single_folded.h(0)  # H† = H
    single_folded.h(0)
    save_circuit(single_folded, "folding_single_after", "After: G G† G")


def generate_identity_insertion_examples():
    """Generate identity insertion circuit diagrams."""
    from qiskit import QuantumCircuit

    # Original circuit
    original = QuantumCircuit(2, name="Original")
    original.h(0)
    original.cx(0, 1)
    original.rz(0.5, 1)

    save_circuit(original, "identity_original", "Original Circuit")

    # With identity insertions (using I gates or delays)
    with_identity = QuantumCircuit(2, name="With Identity Insertions")
    with_identity.h(0)
    with_identity.id(0)  # Identity on qubit 0
    with_identity.id(1)  # Identity on qubit 1
    with_identity.barrier()
    with_identity.cx(0, 1)
    with_identity.id(0)
    with_identity.id(1)
    with_identity.barrier()
    with_identity.rz(0.5, 1)

    save_circuit(with_identity, "identity_inserted", "With Identity Insertions")


def generate_pulse_stretching_conceptual():
    """Generate a conceptual diagram for pulse stretching (not actual pulses)."""
    from qiskit import QuantumCircuit

    # This is conceptual - showing that gate count stays same but duration increases
    original = QuantumCircuit(1, name="Original")
    original.rx(1.0, 0)
    save_circuit(original, "pulse_original", "Original Gate (duration T)")

    # Annotated version showing stretched duration
    stretched = QuantumCircuit(1, name="Stretched")
    stretched.rx(1.0, 0)
    save_circuit(stretched, "pulse_stretched", "Same Gate (duration λT)")


def generate_unoptimization_examples():
    """Generate circuit unoptimization examples using the circuit-unoptimization library."""
    try:
        from qiskit import QuantumCircuit
        from unopt.recipe import unoptimize_circuit

        # Create a simple circuit
        original = QuantumCircuit(3)
        original.h(0)
        original.cx(0, 1)
        original.cx(1, 2)
        original.rz(0.5, 2)

        save_circuit(original, "unopt_original", f"Original (depth={original.depth()}, gates={original.size()})")

        # Apply 1 iteration of unoptimization
        unopt_1 = unoptimize_circuit(original, iterations=1)
        save_circuit(unopt_1, "unopt_iter1", f"1 Iteration (depth={unopt_1.depth()}, gates={unopt_1.size()})")

        # Apply 2 iterations
        unopt_2 = unoptimize_circuit(original, iterations=2)
        save_circuit(unopt_2, "unopt_iter2", f"2 Iterations (depth={unopt_2.depth()}, gates={unopt_2.size()})")

        print("\nCircuit unoptimization examples generated successfully!")

    except ImportError:
        print("\nSkipping circuit unoptimization examples.")
        print("To generate these, install: pip install git+https://github.com/unitaryfoundation/circuit-unoptimization")

        # Create placeholder showing the concept
        from qiskit import QuantumCircuit

        original = QuantumCircuit(2)
        original.cx(0, 1)
        save_circuit(original, "unopt_original", "Original Circuit")

        # Manual example of what unoptimization might look like
        unopt_manual = QuantumCircuit(2)
        # Insert A and A† around the CNOT
        unopt_manual.h(0)
        unopt_manual.h(1)
        unopt_manual.cx(0, 1)
        unopt_manual.h(0)
        unopt_manual.h(1)
        # This is illustrative, not the actual algorithm
        save_circuit(unopt_manual, "unopt_conceptual", "Unoptimized (conceptual)")


def main():
    print("Generating circuit diagrams for QEM Zoo...\n")

    print("=== Unitary Folding ===")
    generate_folding_examples()

    print("\n=== Identity Insertion ===")
    generate_identity_insertion_examples()

    print("\n=== Pulse Stretching (conceptual) ===")
    generate_pulse_stretching_conceptual()

    print("\n=== Circuit Unoptimization ===")
    generate_unoptimization_examples()

    print(f"\nAll diagrams saved to: {OUTPUT_DIR}")
    print("\nTo use in the website, reference images like:")
    print('  <img src="images/circuits/folding_original.svg" alt="Original circuit">')


if __name__ == "__main__":
    main()
