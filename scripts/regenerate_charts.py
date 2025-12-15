"""Reference-only chart regeneration (Python). The web app is authoritative for interactive results."""

import math
import numpy as np
import matplotlib.pyplot as plt

BTU_PER_HR_TO_W = 0.29307107

def effectiveness(UA, C):
    return 1 - math.exp(-UA / C)

def absorbed_vs_distance(UA, distances_ft, btu_per_hr=50000, f_conv=0.70, f_capture=0.85, f_bypass=0.10, C=17,
                         eta_rad=0.55, eta_out=0.65, A=0.70, alpha=0.80, inlet_d_in=24, outlet_d_in=3):
    P_burner = btu_per_hr * BTU_PER_HR_TO_W
    P_plume = P_burner * f_conv
    P_cap = P_plume * f_capture * (1 - f_bypass)
    eps = effectiveness(UA, C)
    P_wall = P_cap * eps
    P_ir = P_wall * eta_rad * eta_out
    r_avg_ft = ((inlet_d_in/2 + outlet_d_in/2)/2) / 12

    y = []
    for s in distances_ft:
        d_m = (s + r_avg_ft) * 0.3048
        E = P_ir / (2*math.pi*d_m*d_m)
        y.append(E * A * alpha)
    return y

def main():
    dist = np.linspace(2, 8, 200)
    for name, UA in [('Smooth',12), ('Ramp',20), ('Stator+Ramp',28)]:
        y = absorbed_vs_distance(UA, dist)
        plt.plot(dist, y, label=name)
    plt.xlabel('Distance from emitter surface (ft)')
    plt.ylabel('Absorbed IR power per standing person (W)')
    plt.title('Absorbed IR vs distance (baseline assumptions)')
    plt.grid(True, alpha=0.25)
    plt.legend()
    plt.tight_layout()
    plt.savefig('absorbed_vs_distance.png', dpi=200)
    print('Wrote absorbed_vs_distance.png')

if __name__ == '__main__':
    main()
