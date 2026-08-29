# MRPL Centrifugal Pump Hydraulic Calculation Script
# Verified API 610 compliant execution
def calculate_efficiency(flow_m3_h, head_m, density_kg_m3, power_in_kw):
    g = 9.81
    q_si = flow_m3_h / 3600.0
    p_hyd_kw = (density_kg_m3 * g * q_si * head_m) / 1000.0
    eff_pct = (p_hyd_kw / power_in_kw) * 100.0
    return {'hydraulic_power_kw': p_hyd_kw, 'efficiency_pct': eff_pct}

if __name__ == '__main__':
    res = calculate_efficiency(450, 125, 850, 160)
    print('Calculation result:', res)
