#!/usr/bin/env python3
"""Generate ZNE workflow diagram similar to Majumdar et al. 2023 Figure 1."""

import matplotlib.pyplot as plt
import numpy as np

# Set up the figure
fig, ax = plt.subplots(figsize=(8, 6))

# Noise factors and expectation values (simulating exponential decay)
lambda_factors = np.array([1, 2, 3])
# Simulated noisy expectation values (decaying with noise)
E_values = np.array([0.65, 0.45, 0.32])
E_errors = np.array([0.03, 0.04, 0.05])

# The "ideal" zero-noise value we're extrapolating to
E_star = 0.85

# Create smooth curve for extrapolation fit
lambda_smooth = np.linspace(0, 3.5, 100)
# Exponential fit: E = E* * exp(-k*lambda)
k = -np.log(E_values[0] / E_star) / lambda_factors[0]
E_fit = E_star * np.exp(-k * lambda_smooth)

# Plot the extrapolation curve (dashed)
ax.plot(lambda_smooth, E_fit, 'b--', linewidth=2, alpha=0.7, label='Extrapolation fit')

# Plot the data points with error bars
ax.errorbar(lambda_factors, E_values, yerr=E_errors, fmt='o', markersize=12,
            color='#e74c3c', capsize=5, capthick=2, elinewidth=2,
            label='Measured values', zorder=5)

# Plot the extrapolated zero-noise point
ax.plot(0, E_star, 's', markersize=14, color='#2ecc71', markeredgecolor='black',
        markeredgewidth=2, label='Zero-noise estimate E*', zorder=6)

# Add horizontal dashed lines from y-axis to points
for i, (lam, E) in enumerate(zip(lambda_factors, E_values)):
    ax.hlines(E, 0, lam, colors='gray', linestyles='dotted', alpha=0.5)
    ax.vlines(lam, 0, E, colors='gray', linestyles='dotted', alpha=0.5)

# Add E* horizontal line
ax.hlines(E_star, 0, 0.3, colors='#2ecc71', linestyles='dotted', alpha=0.7, linewidth=2)

# Labels
ax.set_xlabel('Noise factor λ', fontsize=14)
ax.set_ylabel('Expectation value', fontsize=14)

# Add annotations for noise levels
ax.annotate('λ₁', (lambda_factors[0], -0.02), ha='center', fontsize=12)
ax.annotate('λ₂', (lambda_factors[1], -0.02), ha='center', fontsize=12)
ax.annotate('λ₃', (lambda_factors[2], -0.02), ha='center', fontsize=12)

# Add annotations for E values
ax.annotate('E(λ₁)', (lambda_factors[0] + 0.15, E_values[0]), fontsize=11, color='#e74c3c')
ax.annotate('E(λ₂)', (lambda_factors[1] + 0.15, E_values[1]), fontsize=11, color='#e74c3c')
ax.annotate('E(λ₃)', (lambda_factors[2] + 0.15, E_values[2]), fontsize=11, color='#e74c3c')
ax.annotate('E*', (-0.15, E_star), fontsize=12, fontweight='bold', color='#2ecc71')

# Set axis limits
ax.set_xlim(-0.3, 3.7)
ax.set_ylim(0, 1.0)

# Remove top and right spines
ax.spines['top'].set_visible(False)
ax.spines['right'].set_visible(False)

# Add legend
ax.legend(loc='upper right', fontsize=11, framealpha=0.9)

# Title
ax.set_title('Zero-Noise Extrapolation', fontsize=16, fontweight='bold', pad=15)

plt.tight_layout()
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/zne-workflow.png',
            dpi=150, bbox_inches='tight', facecolor='white')
plt.savefig('/Users/vincent.russo/Projects/research/qemzoo/images/techniques/zne-workflow.svg',
            bbox_inches='tight', facecolor='white')
print("ZNE workflow diagram saved!")
