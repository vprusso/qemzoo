#!/usr/bin/env python3
"""Generate Symmetry-Adjusted Classical Shadows workflow diagram."""

import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import numpy as np

# Set up the figure
fig, ax = plt.subplots(figsize=(12, 7))
ax.set_xlim(0, 12)
ax.set_ylim(0, 8)
ax.axis('off')
ax.set_title('Symmetry-Adjusted Classical Shadows', fontsize=16, fontweight='bold', pad=20)

# Helper function to draw boxes
def draw_box(ax, x, y, width, height, text, color='#3498db', text_color='white', fontsize=10):
    rect = mpatches.FancyBboxPatch((x, y), width, height,
                                    boxstyle="round,pad=0.05,rounding_size=0.2",
                                    facecolor=color, edgecolor='black', linewidth=2)
    ax.add_patch(rect)
    ax.text(x + width/2, y + height/2, text, ha='center', va='center',
            fontsize=fontsize, fontweight='bold', color=text_color, wrap=True)

# Helper for arrows
def draw_arrow(ax, start, end, color='black'):
    ax.annotate('', xy=end, xytext=start,
                arrowprops=dict(arrowstyle='->', color=color, lw=2))

# Row 1: Input state with symmetry
draw_box(ax, 0.5, 6, 2.5, 1.2, 'Target State ρ\nwith symmetry Sλ', '#2c3e50')

# Arrow to quantum circuit
draw_arrow(ax, (3, 6.6), (3.8, 6.6))

# Noisy quantum circuit
draw_box(ax, 3.8, 6, 2.5, 1.2, 'Noisy Circuit\nŨ (with errors)', '#e74c3c')

# Arrow to randomized measurements
draw_arrow(ax, (6.3, 6.6), (7.1, 6.6))

# Randomized measurements (classical shadows)
draw_box(ax, 7.1, 6, 2.5, 1.2, 'Randomized\nMeasurements', '#9b59b6')

# Arrow down to snapshots
draw_arrow(ax, (8.35, 6), (8.35, 5.3))

# Classical shadow snapshots
draw_box(ax, 7.1, 4.1, 2.5, 1.2, 'Shadow\nSnapshots {σ̂}', '#34495e')

# Now show the two paths: standard vs symmetry-adjusted

# Standard path (grayed out)
draw_arrow(ax, (7.1, 4.7), (5.5, 4.7))
draw_box(ax, 2.5, 4.1, 3, 1.2, 'Standard Inversion\nM⁻¹ (no mitigation)', '#bdc3c7', text_color='#7f8c8d')

# Symmetry-adjusted path (highlighted)
draw_arrow(ax, (8.35, 4.1), (8.35, 3.3))

# Symmetry information box (side input)
draw_box(ax, 10, 4.5, 1.8, 1, 'Symmetry\nGroup G', '#27ae60')
draw_arrow(ax, (10, 5), (9.6, 3.8))

# Symmetry-adjusted inversion
draw_box(ax, 6.5, 2.1, 3.7, 1.2, 'Symmetry-Adjusted\nInversion (group-theoretic)', '#27ae60')

# Arrow to final result
draw_arrow(ax, (8.35, 2.1), (8.35, 1.3))

# Error-mitigated estimate
draw_box(ax, 6.5, 0.2, 3.7, 1.1, 'Error-Mitigated\nEstimate ⟨O⟩_SAS', '#2980b9')

# Add annotation boxes for key features
# Feature 1: No calibration
ax.text(0.5, 3.5, '✓ No calibration\n   experiments needed', fontsize=9, color='#27ae60',
        bbox=dict(boxstyle='round', facecolor='#e8f8f5', edgecolor='#27ae60', alpha=0.8))

# Feature 2: Full circuit mitigation
ax.text(0.5, 2.3, '✓ Mitigates errors in\n   full circuit, not\n   just measurements', fontsize=9, color='#27ae60',
        bbox=dict(boxstyle='round', facecolor='#e8f8f5', edgecolor='#27ae60', alpha=0.8))

# Feature 3: No data discarded
ax.text(0.5, 1.0, '✓ No data discarded\n   (unlike post-selection)', fontsize=9, color='#27ae60',
        bbox=dict(boxstyle='round', facecolor='#e8f8f5', edgecolor='#27ae60', alpha=0.8))

# Add labels for the comparison
ax.text(4, 3.5, 'vs', fontsize=12, ha='center', va='center', color='#7f8c8d', fontweight='bold')

# Dashed line connecting to show alternative
ax.plot([5.5, 6.5], [3.5, 2.7], 'k--', alpha=0.3, lw=1.5)

plt.tight_layout()
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/symmetry-adjusted-shadows-workflow.png',
            dpi=150, bbox_inches='tight', facecolor='white')
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/symmetry-adjusted-shadows-workflow.svg',
            bbox_inches='tight', facecolor='white')

print("Symmetry-adjusted shadows workflow diagram saved!")
