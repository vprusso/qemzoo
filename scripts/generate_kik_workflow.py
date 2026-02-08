#!/usr/bin/env python3
"""Generate Adaptive KIK workflow diagram showing pulse inversion concept."""

import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyArrowPatch, Rectangle
import matplotlib.patches as mpatches

# Set up the figure with two panels
fig, axes = plt.subplots(1, 2, figsize=(12, 5))

# --- Left panel: Original pulse schedule ---
ax1 = axes[0]
ax1.set_title('Original Pulse Schedule', fontsize=14, fontweight='bold')

# Time axis
t = np.linspace(0, 1, 500)

# Create a realistic-looking pulse (Gaussian derivative shape)
def gaussian_pulse(t, center, width, amplitude):
    return amplitude * np.exp(-((t - center) ** 2) / (2 * width ** 2))

def drag_pulse(t, center, width, amplitude):
    """DRAG-like pulse shape"""
    gauss = gaussian_pulse(t, center, width, amplitude)
    return gauss

# Multiple pulses representing a gate sequence
pulse1 = drag_pulse(t, 0.2, 0.05, 0.8)
pulse2 = drag_pulse(t, 0.5, 0.08, -0.5)
pulse3 = drag_pulse(t, 0.8, 0.06, 0.6)

total_pulse = pulse1 + pulse2 + pulse3

# Plot pulses
ax1.fill_between(t, 0, total_pulse, alpha=0.3, color='#3498db')
ax1.plot(t, total_pulse, color='#2980b9', linewidth=2, label='Pulse amplitude')

ax1.axhline(y=0, color='gray', linestyle='-', linewidth=0.5)
ax1.set_xlabel('Time t', fontsize=12)
ax1.set_ylabel('Pulse Amplitude A(t)', fontsize=12)
ax1.set_xlim(0, 1)
ax1.set_ylim(-0.8, 1.0)

# Add time labels
ax1.text(0.2, -0.15, 't₁', ha='center', fontsize=11)
ax1.text(0.5, -0.15, 't₂', ha='center', fontsize=11)
ax1.text(0.8, -0.15, 't₃', ha='center', fontsize=11)

# Add annotation
ax1.annotate('H(t)', xy=(0.6, 0.7), fontsize=14, fontweight='bold', color='#2980b9')

ax1.spines['top'].set_visible(False)
ax1.spines['right'].set_visible(False)

# --- Right panel: Inverted pulse schedule ---
ax2 = axes[1]
ax2.set_title('Pulse Inverse (Time & Amplitude Reversed)', fontsize=14, fontweight='bold')

# Invert: reverse time ordering AND negate amplitudes
# Time reversal: t -> (1 - t)
# Amplitude inversion: A -> -A
t_inv = t
pulse1_inv = -drag_pulse(t_inv, 1 - 0.2, 0.05, 0.8)
pulse2_inv = -drag_pulse(t_inv, 1 - 0.5, 0.08, -0.5)
pulse3_inv = -drag_pulse(t_inv, 1 - 0.8, 0.06, 0.6)

total_pulse_inv = pulse1_inv + pulse2_inv + pulse3_inv

# Plot inverted pulses
ax2.fill_between(t_inv, 0, total_pulse_inv, alpha=0.3, color='#e74c3c')
ax2.plot(t_inv, total_pulse_inv, color='#c0392b', linewidth=2, label='Inverted pulse')

ax2.axhline(y=0, color='gray', linestyle='-', linewidth=0.5)
ax2.set_xlabel('Time t', fontsize=12)
ax2.set_ylabel('Pulse Amplitude -A(T-t)', fontsize=12)
ax2.set_xlim(0, 1)
ax2.set_ylim(-1.0, 0.8)

# Add time labels (reversed)
ax2.text(0.2, 0.15, 't₃\'', ha='center', fontsize=11)
ax2.text(0.5, 0.15, 't₂\'', ha='center', fontsize=11)
ax2.text(0.8, 0.15, 't₁\'', ha='center', fontsize=11)

# Add annotation
ax2.annotate('H⁻¹(t) = -H(T-t)', xy=(0.5, -0.85), fontsize=14, fontweight='bold', color='#c0392b')

ax2.spines['top'].set_visible(False)
ax2.spines['right'].set_visible(False)

# Add arrows between panels to show transformation
fig.text(0.5, 0.5, '→', fontsize=40, ha='center', va='center', transform=fig.transFigure)

# Add transformation labels
fig.text(0.5, 0.58, 'Invert amplitude', fontsize=10, ha='center', va='center',
         transform=fig.transFigure, style='italic')
fig.text(0.5, 0.42, 'Reverse time order', fontsize=10, ha='center', va='center',
         transform=fig.transFigure, style='italic')

plt.tight_layout()
plt.subplots_adjust(wspace=0.3)

# Save
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/adaptive-kik-pulse-inverse.png',
            dpi=150, bbox_inches='tight', facecolor='white')
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/adaptive-kik-pulse-inverse.svg',
            bbox_inches='tight', facecolor='white')

print("Pulse inverse diagram saved!")

# --- Second figure: KIK workflow overview ---
fig2, ax = plt.subplots(figsize=(10, 6))
ax.set_xlim(0, 10)
ax.set_ylim(0, 8)
ax.axis('off')
ax.set_title('Adaptive KIK Workflow', fontsize=16, fontweight='bold', pad=20)

# Helper function to draw boxes
def draw_box(ax, x, y, width, height, text, color='#3498db', text_color='white'):
    rect = mpatches.FancyBboxPatch((x, y), width, height,
                                    boxstyle="round,pad=0.05,rounding_size=0.2",
                                    facecolor=color, edgecolor='black', linewidth=2)
    ax.add_patch(rect)
    ax.text(x + width/2, y + height/2, text, ha='center', va='center',
            fontsize=10, fontweight='bold', color=text_color, wrap=True)

# Step 1: Input circuit
draw_box(ax, 0.5, 6, 2, 1.2, 'Circuit K', '#3498db')
ax.annotate('', xy=(3, 6.6), xytext=(2.5, 6.6),
            arrowprops=dict(arrowstyle='->', color='black', lw=2))

# Step 2: Split into two paths
ax.annotate('', xy=(4, 7.2), xytext=(3, 6.6),
            arrowprops=dict(arrowstyle='->', color='black', lw=2))
ax.annotate('', xy=(4, 6), xytext=(3, 6.6),
            arrowprops=dict(arrowstyle='->', color='black', lw=2))

# Upper path: Execute K
draw_box(ax, 4, 6.8, 2.5, 1, 'Execute K\n⟨O⟩_K', '#27ae60')

# Lower path: Construct and execute KIK
draw_box(ax, 4, 5.2, 2.5, 1, 'Build K⁻¹\n(pulse inverse)', '#e74c3c')
ax.annotate('', xy=(7, 5.7), xytext=(6.5, 5.7),
            arrowprops=dict(arrowstyle='->', color='black', lw=2))
draw_box(ax, 7, 5.2, 2.5, 1, 'Execute KIK\n⟨O⟩_KIK', '#e67e22')

# Merge paths
ax.annotate('', xy=(8, 4.5), xytext=(5.25, 6.8),
            arrowprops=dict(arrowstyle='->', color='black', lw=2))
ax.annotate('', xy=(8, 4.5), xytext=(8.25, 5.2),
            arrowprops=dict(arrowstyle='->', color='black', lw=2))

# Combine with adaptive coefficients
draw_box(ax, 6.5, 3, 3, 1.2, 'Combine with\nadaptive α, β', '#9b59b6')

# Arrow to result
ax.annotate('', xy=(8, 2), xytext=(8, 3),
            arrowprops=dict(arrowstyle='->', color='black', lw=2))

# Result
draw_box(ax, 6.5, 0.8, 3, 1, '⟨O⟩_mit = α⟨O⟩_K + β⟨O⟩_KIK', '#2c3e50')

# Add side note about randomized compiling
ax.text(1, 4.5, 'Optional:\nRandomized\nCompiling', fontsize=9, ha='center',
        style='italic', color='#7f8c8d',
        bbox=dict(boxstyle='round', facecolor='#ecf0f1', edgecolor='#bdc3c7'))
ax.annotate('', xy=(1.5, 6), xytext=(1, 5.1),
            arrowprops=dict(arrowstyle='->', color='#7f8c8d', lw=1.5, ls='--'))

plt.tight_layout()
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/adaptive-kik-workflow.png',
            dpi=150, bbox_inches='tight', facecolor='white')
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/adaptive-kik-workflow.svg',
            bbox_inches='tight', facecolor='white')

print("KIK workflow diagram saved!")
