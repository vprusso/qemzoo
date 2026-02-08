#!/usr/bin/env python3
"""Generate workflow diagrams for new QEM techniques."""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# Helper functions
def draw_box(ax, x, y, width, height, text, color='#3498db', text_color='white', fontsize=10):
    rect = mpatches.FancyBboxPatch((x, y), width, height,
                                    boxstyle="round,pad=0.05,rounding_size=0.2",
                                    facecolor=color, edgecolor='black', linewidth=2)
    ax.add_patch(rect)
    ax.text(x + width/2, y + height/2, text, ha='center', va='center',
            fontsize=fontsize, fontweight='bold', color=text_color, wrap=True)

def draw_arrow(ax, start, end, color='black'):
    ax.annotate('', xy=end, xytext=start,
                arrowprops=dict(arrowstyle='->', color=color, lw=2))

# ============================================
# 1. ML-QEM Workflow
# ============================================
def generate_ml_qem_diagram():
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis('off')
    ax.set_title('Machine Learning QEM Workflow', fontsize=16, fontweight='bold', pad=20)

    # Training phase (top)
    ax.text(4, 8.3, 'Training Phase', fontsize=12, fontweight='bold', color='#2c3e50')

    # Near-Clifford circuits
    draw_box(ax, 0.5, 6.5, 2.5, 1.2, 'Near-Clifford\nCircuits', '#9b59b6')

    # Classical simulation
    draw_box(ax, 0.5, 4.8, 2.5, 1.2, 'Classical\nSimulation', '#27ae60')
    draw_arrow(ax, (1.75, 6.5), (1.75, 6))
    ax.text(2, 6.2, 'Ideal\nvalues', fontsize=8, color='#27ae60')

    # Quantum execution
    draw_box(ax, 3.5, 6.5, 2.5, 1.2, 'Quantum\nExecution', '#e74c3c')
    draw_arrow(ax, (3, 7.1), (3.5, 7.1))

    # Noisy outputs
    draw_box(ax, 3.5, 4.8, 2.5, 1.2, 'Noisy\nOutputs', '#e74c3c')
    draw_arrow(ax, (4.75, 6.5), (4.75, 6))

    # Training data
    draw_box(ax, 2, 3.2, 3, 1.2, 'Training Data\n(features, noisy, ideal)', '#34495e')
    draw_arrow(ax, (1.75, 4.8), (2.5, 4.4))
    draw_arrow(ax, (4.75, 4.8), (4.5, 4.4))

    # ML Model
    draw_box(ax, 6.5, 3.2, 2.5, 1.2, 'ML Model\n(RF, NN, GNN)', '#3498db')
    draw_arrow(ax, (5, 3.8), (6.5, 3.8))
    ax.text(5.5, 4.1, 'Train', fontsize=9, color='#3498db')

    # Inference phase (bottom)
    ax.text(10, 8.3, 'Inference Phase', fontsize=12, fontweight='bold', color='#2c3e50')

    # Target circuit
    draw_box(ax, 9.5, 6.5, 2.5, 1.2, 'Target\nCircuit', '#2c3e50')

    # Noisy execution
    draw_box(ax, 9.5, 4.8, 2.5, 1.2, 'Noisy\nExecution', '#e74c3c')
    draw_arrow(ax, (10.75, 6.5), (10.75, 6))

    # Apply model
    draw_arrow(ax, (9, 3.8), (9.5, 4.8))
    draw_arrow(ax, (10.75, 4.8), (10.75, 2.4))

    # Mitigated output
    draw_box(ax, 9.5, 1.2, 2.5, 1.2, 'Error-Mitigated\nEstimate', '#27ae60')

    # Annotations
    ax.text(0.5, 2.5, '2x+ faster\nthan ZNE', fontsize=10, color='#27ae60',
            bbox=dict(boxstyle='round', facecolor='#e8f8f5', edgecolor='#27ae60'))
    ax.text(0.5, 1.2, 'No explicit\nnoise model', fontsize=10, color='#3498db',
            bbox=dict(boxstyle='round', facecolor='#ebf5fb', edgecolor='#3498db'))

    plt.tight_layout()
    plt.savefig('images/techniques/ml-qem-workflow.png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.savefig('images/techniques/ml-qem-workflow.svg', bbox_inches='tight', facecolor='white')
    plt.close()
    print("ML-QEM workflow diagram saved!")

# ============================================
# 2. GSE Workflow
# ============================================
def generate_gse_diagram():
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis('off')
    ax.set_title('Generalized Subspace Expansion (GSE)', fontsize=16, fontweight='bold', pad=20)

    # Noisy state
    draw_box(ax, 0.5, 6.5, 2, 1.2, 'Noisy State\nρ', '#e74c3c')

    # Power subspace construction
    draw_arrow(ax, (2.5, 7.1), (3.2, 7.1))

    # Powers of rho
    draw_box(ax, 3.2, 7.2, 1.5, 0.8, 'ρ', '#3498db')
    draw_box(ax, 4.9, 7.2, 1.5, 0.8, 'ρ²', '#3498db')
    draw_box(ax, 6.6, 7.2, 1.5, 0.8, 'ρ³', '#3498db')
    ax.text(8.3, 7.5, '...', fontsize=14, fontweight='bold')
    draw_box(ax, 8.8, 7.2, 1.5, 0.8, 'ρᵐ', '#3498db')

    ax.text(6, 8.3, 'Expanded Subspace (Power Basis)', fontsize=11, fontweight='bold', color='#3498db', ha='center')

    # Alternative: error-boosted
    ax.text(6, 5.8, 'OR', fontsize=12, fontweight='bold', color='#7f8c8d', ha='center')

    draw_box(ax, 3.2, 4.8, 1.5, 0.8, 'ρ_λ₁', '#9b59b6')
    draw_box(ax, 4.9, 4.8, 1.5, 0.8, 'ρ_λ₂', '#9b59b6')
    draw_box(ax, 6.6, 4.8, 1.5, 0.8, 'ρ_λ₃', '#9b59b6')
    ax.text(8.3, 5.1, '...', fontsize=14, fontweight='bold')
    draw_box(ax, 8.8, 4.8, 1.5, 0.8, 'ρ_λₖ', '#9b59b6')

    ax.text(6, 4.4, 'Error-Boosted States (Noise-Scaled)', fontsize=11, fontweight='bold', color='#9b59b6', ha='center')

    # Measure matrix elements
    draw_arrow(ax, (6, 4.8), (6, 3.8))
    draw_box(ax, 4, 2.5, 4, 1.2, 'Measure H_ij and S_ij\nin expanded basis', '#34495e')

    # Solve eigenvalue problem
    draw_arrow(ax, (6, 2.5), (6, 1.7))
    draw_box(ax, 4, 0.5, 4, 1.2, 'Solve Hc = ESc\n(Gen. Eigenvalue)', '#27ae60')

    # Output
    draw_arrow(ax, (8, 1.1), (9.5, 1.1))
    draw_box(ax, 9.5, 0.5, 3.5, 1.2, 'Error-Mitigated\nEnergy E', '#27ae60')

    # Annotations
    ax.text(10.5, 3, 'Unifies QSE +\nVirtual Distillation', fontsize=9, color='#2c3e50',
            bbox=dict(boxstyle='round', facecolor='#f5f5f5', edgecolor='#2c3e50'))
    ax.text(10.5, 2, 'Handles coherent +\nstochastic + algorithmic', fontsize=9, color='#27ae60',
            bbox=dict(boxstyle='round', facecolor='#e8f8f5', edgecolor='#27ae60'))

    plt.tight_layout()
    plt.savefig('images/techniques/gse-workflow.png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.savefig('images/techniques/gse-workflow.svg', bbox_inches='tight', facecolor='white')
    plt.close()
    print("GSE workflow diagram saved!")

# ============================================
# 3. Pseudo Twirling Workflow
# ============================================
def generate_pseudo_twirling_diagram():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis('off')
    ax.set_title('Pseudo Twirling for Non-Clifford Gates', fontsize=16, fontweight='bold', pad=20)

    # Non-Clifford gate
    draw_box(ax, 0.5, 5, 2.5, 1.5, 'Non-Clifford\nGate G\n(e.g., partial CZ)', '#e74c3c')

    # Problem annotation
    ax.text(0.5, 4.3, 'Pauli twirling\nfails here!', fontsize=9, color='#e74c3c',
            bbox=dict(boxstyle='round', facecolor='#fadbd8', edgecolor='#e74c3c'))

    # Arrow to pseudo twirling
    draw_arrow(ax, (3, 5.75), (4, 5.75))

    # Pseudo twirling box
    draw_box(ax, 4, 4.5, 3.5, 2.5, 'Pseudo Twirling\n\nQ·G·P ≈ G + O(ε)\n\nApproximate\ncommutation', '#3498db')

    # Multiple randomizations
    draw_arrow(ax, (7.5, 5.75), (8.5, 6.5))
    draw_arrow(ax, (7.5, 5.75), (8.5, 5.75))
    draw_arrow(ax, (7.5, 5.75), (8.5, 5))

    draw_box(ax, 8.5, 6, 2.5, 1, 'Q₁·G·P₁', '#9b59b6')
    draw_box(ax, 8.5, 4.8, 2.5, 1, 'Q₂·G·P₂', '#9b59b6')
    draw_box(ax, 8.5, 3.6, 2.5, 1, 'Q₃·G·P₃', '#9b59b6')
    ax.text(9.75, 3.2, '...', fontsize=14, fontweight='bold', ha='center')

    # Average
    draw_arrow(ax, (11, 5.2), (11.5, 5.2))
    draw_box(ax, 11.5, 4.5, 2, 1.5, 'Average\nResults', '#27ae60')

    # Result annotation
    draw_arrow(ax, (12.5, 4.5), (12.5, 3))
    ax.text(11, 2.5, 'Coherent → Quasi-Stochastic', fontsize=10, fontweight='bold', color='#27ae60',
            bbox=dict(boxstyle='round', facecolor='#e8f8f5', edgecolor='#27ae60'))

    # Combined with KIK
    ax.text(0.5, 1.5, 'Can combine with KIK:', fontsize=10, fontweight='bold', color='#2c3e50')
    draw_box(ax, 0.5, 0.3, 3, 1, 'Pseudo Twirling\n(coherent)', '#3498db')
    ax.text(3.7, 0.8, '+', fontsize=14, fontweight='bold')
    draw_box(ax, 4, 0.3, 3, 1, 'Adaptive KIK\n(incoherent)', '#9b59b6')
    ax.text(7.2, 0.8, '=', fontsize=14, fontweight='bold')
    draw_box(ax, 7.5, 0.3, 3.5, 1, 'Full Error\nMitigation', '#27ae60')

    plt.tight_layout()
    plt.savefig('images/techniques/pseudo-twirling-workflow.png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.savefig('images/techniques/pseudo-twirling-workflow.svg', bbox_inches='tight', facecolor='white')
    plt.close()
    print("Pseudo twirling workflow diagram saved!")

# ============================================
# 4. Symmetric Clifford Twirling Workflow
# ============================================
def generate_symmetric_clifford_twirling_diagram():
    fig, ax = plt.subplots(figsize=(14, 7))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 8)
    ax.axis('off')
    ax.set_title('Symmetric Clifford Twirling', fontsize=16, fontweight='bold', pad=20)

    # Target operation with symmetry
    draw_box(ax, 0.5, 5.5, 2.5, 1.5, 'Target Op\nwith symmetry\n[G, P] = 0', '#2c3e50')

    # Identify symmetric Cliffords
    draw_arrow(ax, (3, 6.25), (4, 6.25))
    draw_box(ax, 4, 5.5, 3, 1.5, 'Symmetric Cliffords\nC in Cliff_sym\n[C, P] = 0', '#3498db')

    # Apply twirling
    draw_arrow(ax, (7, 6.25), (8, 6.25))
    draw_box(ax, 8, 5.5, 3, 1.5, 'Apply\nC_L · G · C_R', '#9b59b6')

    # Multiple instances
    draw_arrow(ax, (11, 6.25), (11.5, 6.25))
    draw_arrow(ax, (11, 5.5), (11.5, 4.8))

    ax.text(12, 6.5, 'Instance 1', fontsize=9)
    ax.text(12, 5.5, 'Instance 2', fontsize=9)
    ax.text(12, 4.5, '...', fontsize=12)
    ax.text(12, 3.5, 'Instance N', fontsize=9)

    # Average to white noise
    draw_arrow(ax, (12.5, 3.5), (12.5, 2.5))
    draw_box(ax, 10.5, 1, 3, 1.3, '≈ Global White\nNoise + O(e⁻ⁿ)', '#27ae60')

    # Structure preserved
    ax.text(0.5, 3.5, 'Key insight:', fontsize=10, fontweight='bold', color='#2c3e50')
    ax.text(0.5, 2.8, 'Only use Cliffords that\ncommute with symmetry', fontsize=9, color='#3498db',
            bbox=dict(boxstyle='round', facecolor='#ebf5fb', edgecolor='#3498db'))
    ax.text(0.5, 1.5, 'Structure preserved +\nNoise scrambled', fontsize=9, color='#27ae60',
            bbox=dict(boxstyle='round', facecolor='#e8f8f5', edgecolor='#27ae60'))

    # Fix the formula to use plain text
    ax.patches[-1]  # reference last box

    # Hardware efficient variant
    draw_box(ax, 4.5, 1, 4, 1.3, 'Hardware-efficient:\nLocal symmetric Cliffords', '#f39c12')
    ax.text(4.5, 0.3, 'Reduces gate overhead', fontsize=9, color='#f39c12')

    plt.tight_layout()
    plt.savefig('images/techniques/symmetric-clifford-twirling-workflow.png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.savefig('images/techniques/symmetric-clifford-twirling-workflow.svg', bbox_inches='tight', facecolor='white')
    plt.close()
    print("Symmetric Clifford twirling workflow diagram saved!")

# ============================================
# 5. Sparse Pauli-Lindblad Workflow
# ============================================
def generate_sparse_pauli_lindblad_diagram():
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 14)
    ax.set_ylim(0, 9)
    ax.axis('off')
    ax.set_title('Sparse Pauli-Lindblad Noise Learning', fontsize=16, fontweight='bold', pad=20)

    # Calibration circuits
    draw_box(ax, 0.5, 6.5, 2.5, 1.5, 'Calibration\nCircuits\n(per layer)', '#9b59b6')

    # Execute on hardware
    draw_arrow(ax, (3, 7.25), (4, 7.25))
    draw_box(ax, 4, 6.5, 2.5, 1.5, 'Execute on\nQuantum\nHardware', '#e74c3c')

    # Fit sparse model
    draw_arrow(ax, (6.5, 7.25), (7.5, 7.25))
    draw_box(ax, 7.5, 6.2, 4, 2, 'Fit Sparse Pauli-Lindblad\n\nℒ(ρ) = Σᵢ λᵢ(PᵢρPᵢ - ρ)\n\nLow-weight, local Paulis', '#3498db')

    # Two uses
    draw_arrow(ax, (9.5, 6.2), (8, 5))
    draw_arrow(ax, (9.5, 6.2), (11, 5))

    # PEC path
    draw_box(ax, 6.5, 3.5, 3, 1.3, 'Invert for PEC\nN^-1 = exp(-L)', '#27ae60')
    draw_arrow(ax, (8, 3.5), (8, 2.2))
    draw_box(ax, 6.5, 1, 3, 1.2, 'Scalable\nPEC', '#27ae60')

    # PEA path
    draw_box(ax, 10, 3.5, 3, 1.3, 'Amplify for ZNE\nInject cλᵢ noise', '#f39c12')
    draw_arrow(ax, (11.5, 3.5), (11.5, 2.2))
    draw_box(ax, 10, 1, 3, 1.2, 'Accurate\nPEA/ZNE', '#f39c12')

    # Scalability note
    ax.text(0.5, 4, 'Key Properties:', fontsize=10, fontweight='bold', color='#2c3e50')
    ax.text(0.5, 3.3, '• Scales to 100+ qubits', fontsize=9)
    ax.text(0.5, 2.7, '• Captures crosstalk', fontsize=9)
    ax.text(0.5, 2.1, '• O(n·4ʷ) parameters', fontsize=9)
    ax.text(0.5, 1.5, '• Enabled 127-qubit demo', fontsize=9, color='#27ae60', fontweight='bold')

    # Formula box
    ax.text(1, 5.5, 'Sparsity: weight(Pᵢ) ≤ 2\nLocality: neighboring qubits',
            fontsize=9, color='#3498db',
            bbox=dict(boxstyle='round', facecolor='#ebf5fb', edgecolor='#3498db'))

    plt.tight_layout()
    plt.savefig('images/techniques/sparse-pauli-lindblad-workflow.png', dpi=150, bbox_inches='tight', facecolor='white')
    plt.savefig('images/techniques/sparse-pauli-lindblad-workflow.svg', bbox_inches='tight', facecolor='white')
    plt.close()
    print("Sparse Pauli-Lindblad workflow diagram saved!")

if __name__ == "__main__":
    generate_ml_qem_diagram()
    generate_gse_diagram()
    generate_pseudo_twirling_diagram()
    generate_symmetric_clifford_twirling_diagram()
    generate_sparse_pauli_lindblad_diagram()
    print("\nAll diagrams generated!")
