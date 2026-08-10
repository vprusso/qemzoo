import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches

fig, ax = plt.subplots(figsize=(11, 6.5))
ax.set_xlim(0, 11); ax.set_ylim(0, 8.4); ax.axis('off')
ax.set_title('Adaptive KIK Workflow', fontsize=16, fontweight='bold', pad=16)

def box(x, y, w, h, text, color, fs=10, tc='white'):
    ax.add_patch(mpatches.FancyBboxPatch((x, y), w, h,
        boxstyle="round,pad=0.05,rounding_size=0.2",
        facecolor=color, edgecolor='black', linewidth=2))
    ax.text(x + w/2, y + h/2, text, ha='center', va='center',
            fontsize=fs, fontweight='bold', color=tc)

def arrow(x1, y1, x2, y2, color='black', ls='-', lw=2):
    ax.annotate('', xy=(x2, y2), xytext=(x1, y1),
                arrowprops=dict(arrowstyle='->', color=color, lw=lw, ls=ls))

# Row 1
box(0.9, 6.6, 3.0, 1.2, 'Circuit K\n(noisy implementation of U)', '#3498db', fs=10)
arrow(3.9, 7.2, 5.0, 7.2)
box(5.0, 6.6, 5.1, 1.2,
    'Inverse evolution $K_I$\n$H_I(t) = -H(T-t)$,  i.e.  $A(t) \\rightarrow -A(T-t)$', '#e74c3c', fs=10)

ax.text(2.4, 5.75, 'optional: randomized compiling', fontsize=9, ha='center',
        style='italic', color='#7f8c8d')
arrow(2.4, 6.6, 2.4, 6.0, color='#7f8c8d', ls='--', lw=1.5)
arrow(2.4, 5.5, 2.4, 4.9, color='#7f8c8d', ls='--', lw=1.5)

arrow(7.5, 6.6, 7.5, 4.9)

# Row 2
box(2.4, 3.7, 6.2, 1.2,
    'Execute  $K(K_I K)^m$  for  $m = 0, 1, \\ldots, M$;   measure  $\\langle A \\rangle_m$', '#27ae60', fs=11)
arrow(5.5, 3.7, 5.5, 3.0)

# Row 3
box(0.4, 1.8, 3.0, 1.2, 'Probe the noise strength\n(one experimental parameter)', '#f39c12', fs=9.5)
box(4.0, 1.8, 5.4, 1.2, 'Fix the coefficients $a_m^{(M)}$ from the\npolynomial expansion of $(K_I K)^{-1/2}$', '#9b59b6', fs=10)
arrow(3.4, 2.4, 4.0, 2.4)
arrow(6.7, 1.8, 6.7, 1.2)

# Row 4
box(3.2, 0.0, 7.0, 1.2,
    '$\\langle A \\rangle^{(M)} = \\sum_{m=0}^{M} a_m^{(M)} \\, \\langle A \\rangle_m \\approx \\langle A \\rangle_{\\mathrm{ideal}}$',
    '#2c3e50', fs=13)

plt.tight_layout()
plt.savefig('images/techniques/kik-workflow.png', dpi=150, bbox_inches='tight', facecolor='white')
plt.savefig('images/techniques/kik-workflow.svg', bbox_inches='tight', facecolor='white')
print('saved')
