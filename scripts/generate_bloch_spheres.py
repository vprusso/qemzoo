#!/usr/bin/env python3
"""
Generate Bloch sphere visualizations showing how different noise types affect quantum states.

Each visualization shows:
- The ideal Bloch sphere (faint wireframe)
- How a pure state evolves under the noise channel
- The effect region showing where states can end up

Requires: qiskit, matplotlib, numpy
"""

import numpy as np
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d import Axes3D
from pathlib import Path
import json

# Output directory
OUTPUT_DIR = Path(__file__).parent.parent / "assets" / "bloch"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# Noise channel definitions
NOISE_TYPES = {
    "depolarizing": {
        "name": "Depolarizing Noise",
        "description": "Uniform contraction toward origin",
        "effect": "shrink_uniform",
        "params": [0.0, 0.3, 0.6, 0.9]  # noise strengths
    },
    "dephasing": {
        "name": "Dephasing (T2)",
        "description": "Contraction toward z-axis",
        "effect": "shrink_xy",
        "params": [0.0, 0.3, 0.6, 0.9]
    },
    "amplitude-damping": {
        "name": "Amplitude Damping (T1)",
        "description": "Decay toward |0⟩ (north pole)",
        "effect": "amplitude_damp",
        "params": [0.0, 0.3, 0.6, 0.9]
    },
    "bit-flip": {
        "name": "Bit Flip",
        "description": "Contraction toward x-axis",
        "effect": "shrink_yz",
        "params": [0.0, 0.3, 0.6, 0.9]
    },
    "phase-flip": {
        "name": "Phase Flip",
        "description": "Contraction toward z-axis",
        "effect": "shrink_xy",
        "params": [0.0, 0.3, 0.6, 0.9]
    },
    "coherent-errors": {
        "name": "Coherent Errors",
        "description": "Rotation to wrong location",
        "effect": "rotate",
        "params": [0.0, 0.1, 0.2, 0.3]  # rotation angles (in units of pi)
    }
}


def bloch_sphere_wireframe(ax, alpha=0.15):
    """Draw a wireframe Bloch sphere."""
    u = np.linspace(0, 2 * np.pi, 50)
    v = np.linspace(0, np.pi, 30)
    x = np.outer(np.cos(u), np.sin(v))
    y = np.outer(np.sin(u), np.sin(v))
    z = np.outer(np.ones(np.size(u)), np.cos(v))
    ax.plot_surface(x, y, z, alpha=alpha, color='lightgray', edgecolor='none')

    # Draw axis lines
    ax.plot([-1.2, 1.2], [0, 0], [0, 0], 'k-', alpha=0.3, linewidth=0.5)
    ax.plot([0, 0], [-1.2, 1.2], [0, 0], 'k-', alpha=0.3, linewidth=0.5)
    ax.plot([0, 0], [0, 0], [-1.2, 1.2], 'k-', alpha=0.3, linewidth=0.5)

    # Label axes
    ax.text(1.35, 0, 0, 'X', fontsize=10, ha='center')
    ax.text(0, 1.35, 0, 'Y', fontsize=10, ha='center')
    ax.text(0, 0, 1.35, '|0⟩', fontsize=10, ha='center')
    ax.text(0, 0, -1.35, '|1⟩', fontsize=10, ha='center')


def apply_noise(points, noise_type, param):
    """Apply noise transformation to Bloch sphere points."""
    x, y, z = points

    if noise_type == "shrink_uniform":
        # Depolarizing: uniform shrink toward origin
        scale = 1 - param
        return scale * x, scale * y, scale * z

    elif noise_type == "shrink_xy":
        # Dephasing/phase flip: shrink x,y toward z-axis
        scale = 1 - param
        return scale * x, scale * y, z

    elif noise_type == "shrink_yz":
        # Bit flip: shrink y,z toward x-axis
        scale = 1 - param
        return x, scale * y, scale * z

    elif noise_type == "amplitude_damp":
        # Amplitude damping: shrink and drift toward |0⟩
        gamma = param
        new_x = np.sqrt(1 - gamma) * x
        new_y = np.sqrt(1 - gamma) * y
        new_z = (1 - gamma) * z + gamma  # drift toward +z (|0⟩)
        return new_x, new_y, new_z

    elif noise_type == "rotate":
        # Coherent error: rotation around z-axis
        theta = param * np.pi
        new_x = np.cos(theta) * x - np.sin(theta) * y
        new_y = np.sin(theta) * x + np.cos(theta) * y
        return new_x, new_y, z

    return x, y, z


def generate_initial_states():
    """Generate a set of pure states on the Bloch sphere."""
    # Points on the sphere surface
    n_phi = 12
    n_theta = 8
    phi = np.linspace(0, 2 * np.pi, n_phi, endpoint=False)
    theta = np.linspace(0.2, np.pi - 0.2, n_theta)

    points_x, points_y, points_z = [], [], []
    for t in theta:
        for p in phi:
            points_x.append(np.sin(t) * np.cos(p))
            points_y.append(np.sin(t) * np.sin(p))
            points_z.append(np.cos(t))

    # Add poles
    points_x.extend([0, 0])
    points_y.extend([0, 0])
    points_z.extend([1, -1])

    return np.array(points_x), np.array(points_y), np.array(points_z)


def generate_bloch_visualization(noise_id, noise_info):
    """Generate a multi-panel Bloch sphere visualization for a noise type."""
    fig = plt.figure(figsize=(14, 4))
    fig.suptitle(f"{noise_info['name']}: {noise_info['description']}", fontsize=14, y=0.98)

    params = noise_info['params']
    effect = noise_info['effect']

    # Get initial states
    init_x, init_y, init_z = generate_initial_states()

    for i, param in enumerate(params):
        ax = fig.add_subplot(1, 4, i + 1, projection='3d')

        # Draw wireframe sphere
        bloch_sphere_wireframe(ax, alpha=0.1)

        # Apply noise and plot transformed states
        new_x, new_y, new_z = apply_noise((init_x, init_y, init_z), effect, param)

        # Color by initial z-coordinate for visual tracking
        colors = plt.cm.RdYlBu((init_z + 1) / 2)

        # Plot initial states (faint)
        ax.scatter(init_x, init_y, init_z, c='lightgray', s=20, alpha=0.3)

        # Plot transformed states
        ax.scatter(new_x, new_y, new_z, c=colors, s=30, alpha=0.8, edgecolors='k', linewidths=0.3)

        # Draw arrows from initial to final position for a subset
        for j in range(0, len(init_x), 8):
            if param > 0:
                ax.plot([init_x[j], new_x[j]], [init_y[j], new_y[j]], [init_z[j], new_z[j]],
                       'gray', alpha=0.3, linewidth=0.5)

        # Set viewing angle and limits
        ax.set_xlim([-1.3, 1.3])
        ax.set_ylim([-1.3, 1.3])
        ax.set_zlim([-1.3, 1.3])
        ax.view_init(elev=20, azim=45)

        # Remove axis clutter
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_zticks([])
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False
        ax.xaxis.pane.set_edgecolor('none')
        ax.yaxis.pane.set_edgecolor('none')
        ax.zaxis.pane.set_edgecolor('none')

        # Label
        if effect == "rotate":
            label = f"θ = {param}π"
        else:
            label = f"p = {param}"
        ax.set_title(label, fontsize=11, pad=-5)

    plt.tight_layout()

    # Save
    output_path = OUTPUT_DIR / f"{noise_id}.svg"
    plt.savefig(output_path, format='svg', bbox_inches='tight', transparent=True)
    print(f"  Saved: {output_path}")

    # Also save PNG for broader compatibility
    output_path_png = OUTPUT_DIR / f"{noise_id}.png"
    plt.savefig(output_path_png, format='png', dpi=150, bbox_inches='tight', transparent=True)
    print(f"  Saved: {output_path_png}")

    plt.close()


def generate_summary_visualization():
    """Generate a summary image showing all noise types side by side."""
    fig = plt.figure(figsize=(16, 10))
    fig.suptitle("Noise Effects on the Bloch Sphere", fontsize=16, y=0.98)

    noise_list = list(NOISE_TYPES.items())
    n_rows = 2
    n_cols = 3

    for idx, (noise_id, noise_info) in enumerate(noise_list):
        ax = fig.add_subplot(n_rows, n_cols, idx + 1, projection='3d')

        # Draw wireframe sphere
        bloch_sphere_wireframe(ax, alpha=0.1)

        # Get initial states
        init_x, init_y, init_z = generate_initial_states()

        # Apply moderate noise (use second-to-last param for visible effect)
        param = noise_info['params'][-2]
        effect = noise_info['effect']
        new_x, new_y, new_z = apply_noise((init_x, init_y, init_z), effect, param)

        # Color by initial z-coordinate
        colors = plt.cm.RdYlBu((init_z + 1) / 2)

        # Plot transformed states
        ax.scatter(new_x, new_y, new_z, c=colors, s=25, alpha=0.8, edgecolors='k', linewidths=0.3)

        # Settings
        ax.set_xlim([-1.3, 1.3])
        ax.set_ylim([-1.3, 1.3])
        ax.set_zlim([-1.3, 1.3])
        ax.view_init(elev=20, azim=45)
        ax.set_xticks([])
        ax.set_yticks([])
        ax.set_zticks([])
        ax.xaxis.pane.fill = False
        ax.yaxis.pane.fill = False
        ax.zaxis.pane.fill = False
        ax.xaxis.pane.set_edgecolor('none')
        ax.yaxis.pane.set_edgecolor('none')
        ax.zaxis.pane.set_edgecolor('none')

        ax.set_title(f"{noise_info['name']}\n({noise_info['description']})", fontsize=10)

    plt.tight_layout()

    output_path = OUTPUT_DIR / "noise-summary.svg"
    plt.savefig(output_path, format='svg', bbox_inches='tight', transparent=True)
    print(f"  Saved: {output_path}")

    output_path_png = OUTPUT_DIR / "noise-summary.png"
    plt.savefig(output_path_png, format='png', dpi=150, bbox_inches='tight', transparent=True)
    print(f"  Saved: {output_path_png}")

    plt.close()


def main():
    print("Generating Bloch sphere visualizations...")
    print(f"Output directory: {OUTPUT_DIR}")
    print()

    # Generate individual noise type visualizations
    for noise_id, noise_info in NOISE_TYPES.items():
        print(f"Generating {noise_info['name']}...")
        generate_bloch_visualization(noise_id, noise_info)

    # Generate summary visualization
    print("\nGenerating summary visualization...")
    generate_summary_visualization()

    print("\nDone!")


if __name__ == "__main__":
    main()
