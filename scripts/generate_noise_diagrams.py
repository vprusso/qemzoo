#!/usr/bin/env python3
"""Generate noise type diagrams: leakage energy levels and crosstalk triangle."""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
import numpy as np

# Set up consistent styling
plt.rcParams['font.family'] = 'sans-serif'
plt.rcParams['font.size'] = 14
plt.rcParams['mathtext.fontset'] = 'stix'


def create_leakage_diagram(output_path: str):
    """Create an energy level diagram showing leakage to higher states."""
    fig, ax = plt.subplots(figsize=(6, 5))

    # Draw the potential well (parabola)
    x = np.linspace(-2, 2, 100)
    y = 0.3 * x**2
    ax.plot(x, y, 'k-', linewidth=2)

    # Energy levels
    levels = [
        (0.3, r'$|0\rangle$'),
        (0.6, r'$|1\rangle$'),
        (1.0, r'$|2\rangle$'),
    ]

    level_width = 1.2
    for y_pos, label in levels:
        ax.hlines(y_pos, -level_width/2, level_width/2, colors='k', linewidth=2.5)
        ax.text(level_width/2 + 0.15, y_pos, label, fontsize=16, va='center')

    # Transition arrows and labels
    arrow_x = -0.35
    arrow_props = dict(arrowstyle='<->', color='black', lw=1.5)

    # ω₀₁ transition (computational subspace)
    ax.annotate('', xy=(arrow_x, 0.3), xytext=(arrow_x, 0.6),
                arrowprops=arrow_props)
    ax.text(arrow_x - 0.15, 0.45, r'$\omega_{01}$', fontsize=14, ha='right', va='center')

    # ω₁₂ transition (leakage)
    ax.annotate('', xy=(arrow_x, 0.6), xytext=(arrow_x, 1.0),
                arrowprops=arrow_props)
    ax.text(arrow_x - 0.15, 0.8, r'$\omega_{12} \neq \omega_{01}$', fontsize=12, ha='right', va='center')

    # ω₂₃ transition hint (even higher leakage)
    ax.annotate('', xy=(arrow_x, 1.0), xytext=(arrow_x, 1.25),
                arrowprops=dict(arrowstyle='->', color='black', lw=1.5, ls='--'))
    ax.text(arrow_x - 0.15, 1.12, r'$\omega_{23} \neq \omega_{01}$', fontsize=12, ha='right', va='center')

    # Title
    ax.set_title('Leakage', fontsize=18, fontweight='bold', pad=15)

    # Clean up axes
    ax.set_xlim(-2.2, 2.2)
    ax.set_ylim(0, 1.4)
    ax.set_aspect('equal')
    ax.axis('off')

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"Created: {output_path}")


def create_crosstalk_diagram(output_path: str):
    """Create a triangle diagram showing crosstalk between three qubits."""
    fig, ax = plt.subplots(figsize=(3.5, 3.5))

    # Triangle vertices (equilateral, pointing up)
    angle_offset = np.pi / 2  # Start from top
    angles = [angle_offset + i * 2 * np.pi / 3 for i in range(3)]
    radius = 1.0

    vertices = [(radius * np.cos(a), radius * np.sin(a)) for a in angles]

    # Draw triangle edges
    triangle_color = '#1a237e'  # Dark blue
    for i in range(3):
        x1, y1 = vertices[i]
        x2, y2 = vertices[(i + 1) % 3]
        ax.plot([x1, x2], [y1, y2], color=triangle_color, linewidth=3, zorder=1)

    # Draw qubit circles
    qubit_color = '#1a237e'
    qubit_radius = 0.25
    labels = [r'$Q_0$', r'$Q_1$', r'$Q_2$']

    for i, (x, y) in enumerate(vertices):
        circle = plt.Circle((x, y), qubit_radius, color=qubit_color, zorder=2)
        ax.add_patch(circle)
        ax.text(x, y, labels[i], color='white', fontsize=16, fontweight='bold',
                ha='center', va='center', zorder=3)

    # Title
    ax.set_title('Crosstalk', fontsize=18, fontweight='bold', pad=15)

    # Clean up axes
    ax.set_xlim(-1.6, 1.6)
    ax.set_ylim(-1.4, 1.6)
    ax.set_aspect('equal')
    ax.axis('off')

    plt.tight_layout()
    plt.savefig(output_path, dpi=150, bbox_inches='tight',
                facecolor='white', edgecolor='none')
    plt.close()
    print(f"Created: {output_path}")


if __name__ == '__main__':
    import os

    # Output directory
    output_dir = 'assets/noise'
    os.makedirs(output_dir, exist_ok=True)

    # Generate diagrams
    create_leakage_diagram(f'{output_dir}/leakage-diagram.png')
    create_crosstalk_diagram(f'{output_dir}/crosstalk-diagram.png')

    print("\nDone! Generated noise diagrams.")
