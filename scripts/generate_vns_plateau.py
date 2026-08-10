#!/usr/bin/env python3
"""Figure for the virtual noise scaling entry.

The mitigation function of order m is the normalised incomplete integral

    G(m, s) = int_0^s (1 - t^2)^m dt / int_0^1 (1 - t^2)^m dt
            = sum_k C(m, k) (-1)^k s^(2k+1) / (2k+1)  (normalised),

which is exactly the polynomial sum_k a_k s^(2k+1) applied to each noise
eigenvalue s. Panel (a) shows why the expansion point matters: the plateau
where G maps eigenvalues to 1 straddles s = 1, so the physical interval
[s_min, 1] sits on its edge while the rescaled interval [g s_min, g] sits in
the middle. Panel (b) is the consequence, the worst-case infidelity at each
mitigation order with and without the rescaling.
"""

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from math import comb

S_MIN = 0.4  # smallest eigenvalue of the noise operator, strong-noise example


def mitigation_function(m, s):
    """G(m, s), normalised so that G(m, 1) = 1."""
    s = np.asarray(s, dtype=float)
    coeffs = [comb(m, k) * (-1) ** k / (2 * k + 1) for k in range(m + 1)]
    num = sum(c * s ** (2 * k + 1) for k, c in enumerate(coeffs))
    return num / sum(coeffs)


def infidelity_plain(m, s_min=S_MIN):
    """Worst-case infidelity of order-m Taylor mitigation: G is increasing on
    (0, 1), so the worst eigenvalue is s_min."""
    return 1.0 - mitigation_function(m, s_min)


def infidelity_vns(m, s_min=S_MIN, g_grid=None):
    """Worst-case infidelity after rescaling, minimised over the scaling g."""
    if g_grid is None:
        g_grid = np.linspace(1.0, 3.0, 800)
    best = np.inf
    best_g = 1.0
    for g in g_grid:
        s = np.linspace(g * s_min, g, 400)
        worst = np.max(np.abs(1.0 - mitigation_function(m, s)))
        if worst < best:
            best, best_g = worst, g
    return best, best_g


fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4.8))

# --- (a) the mitigation function and where the eigenvalues sit ---------------
s = np.linspace(0, 1.75, 900)
colors = {3: "#a9c9e8", 7: "#5b9bd5", 15: "#1f4e79"}
for m, c in colors.items():
    ax1.plot(s, mitigation_function(m, s), color=c, lw=2, label=f"order $m = {m}$")

ax1.axhline(1.0, color="gray", ls=":", lw=1)
ax1.set_xlim(0, 1.75)
ax1.set_ylim(0, 1.45)
ax1.set_xlabel("noise eigenvalue $s$", fontsize=11)
ax1.set_ylabel("mitigation function $G(m, s)$", fontsize=11)
ax1.set_title("Eigenvalues are mapped to 1 on the plateau", fontsize=12, fontweight="bold")
ax1.legend(loc="lower right", fontsize=9, frameon=True, framealpha=0.9, edgecolor="none")

_, g_star = infidelity_vns(15)
def range_bar(ax, x0, x1, y, color, label):
    ax.plot([x0, x1], [y, y], color=color, lw=2.2, solid_capstyle="butt")
    for x in (x0, x1):
        ax.plot([x, x], [y - 0.028, y + 0.028], color=color, lw=2.2)
        ax.plot([x, x], [0, y], color=color, ls=":", lw=1, alpha=0.55)
    ax.text(0.5 * (x0 + x1), y + 0.05, label, ha="center", va="bottom",
            fontsize=9, color=color)

range_bar(ax1, S_MIN, 1.0, 1.13, "#c0392b", "physical noise,  $[s_{\\min},\\, 1]$")
range_bar(ax1, g_star * S_MIN, g_star, 1.30, "#1f4e79", f"after rescaling by $g = {g_star:.2f}$")

# where the worst eigenvalue lands, before and after
for m, c in colors.items():
    ax1.plot([S_MIN], [mitigation_function(m, S_MIN)], "o", color=c, ms=6, zorder=5)
ax1.plot([g_star * S_MIN], [mitigation_function(15, g_star * S_MIN)], "o", color=colors[15],
         ms=7, mfc="white", mew=1.8, zorder=5)

# --- (b) what the rescaling buys ---------------------------------------------
orders = np.arange(1, 16)
plain = np.array([infidelity_plain(m) for m in orders])
vns = np.array([infidelity_vns(m)[0] for m in orders])

ax2.semilogy(orders, plain, "o-", color="#c0392b", lw=2, ms=5, label="Taylor mitigation")
ax2.semilogy(orders, vns, "s-", color="#1f4e79", lw=2, ms=5, label="with virtual noise scaling")

m_ref = 7
target = vns[list(orders).index(m_ref)]
m_match = int(orders[np.argmax(plain <= target)])
ax2.axhline(target, color="gray", ls=":", lw=1)
ax2.plot([m_ref], [target], "s", color="#1f4e79", ms=10, mfc="none", mew=2)
ax2.plot([m_match], [plain[list(orders).index(m_match)]], "o", color="#c0392b", ms=10, mfc="none", mew=2)
ax2.annotate(f"order {m_ref} with rescaling reaches what\norder {m_match} reaches without it",
             xy=(m_ref, target * 1.15), xytext=(8.4, target * 9), fontsize=9,
             arrowprops=dict(arrowstyle="->", color="#555", lw=1.2))

ax2.set_xlabel("mitigation order $m$", fontsize=11)
ax2.set_ylabel("worst-case infidelity", fontsize=11)
ax2.set_title(f"Same accuracy at lower order  ($s_{{\\min}} = {S_MIN}$)", fontsize=12, fontweight="bold")
ax2.set_xticks(range(1, 16, 2))
ax2.legend(loc="lower left", fontsize=9, frameon=False)
ax2.grid(alpha=0.25, which="both", ls=":")

for ax in (ax1, ax2):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

plt.tight_layout()
plt.savefig("images/extrapolation/virtual-noise-scaling-plateau.png", dpi=150,
            bbox_inches="tight", facecolor="white")
plt.savefig("images/extrapolation/virtual-noise-scaling-plateau.svg",
            bbox_inches="tight", facecolor="white")

print(f"optimal g at m=15: {g_star:.3f}")
print(f"VNS order {m_ref} infidelity: {target:.3e}; plain order {m_match}: {plain[list(orders).index(m_match)]:.3e}")
print("G(m,1) check:", [round(float(mitigation_function(m, 1.0)), 12) for m in (3, 7, 15)])
