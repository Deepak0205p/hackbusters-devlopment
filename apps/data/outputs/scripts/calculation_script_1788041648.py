# MRPL P-101A Crude Charge Pump Hydraulic Power & Efficiency Calculation
Q_m3_h = 450.0       # Volumetric Flow Rate [m3/h]
H_m = 125.0          # Total Dynamic Head [m]
rho_kg_m3 = 850.0    # Arabian Light Crude Density [kg/m3]
g_m_s2 = 9.81        # Gravitational Acceleration [m/s2]
P_in_kW = 160.0      # Motor Electrical Input Power [kW]

# 1. Convert flow rate to m3/s
Q_m3_s = Q_m3_h / 3600.0

# 2. Calculate Hydraulic Power Generated (kW)
P_hyd_kW = (rho_kg_m3 * g_m_s2 * Q_m3_s * H_m) / 1000.0

# 3. Calculate Operating Hydraulic Efficiency (%)
efficiency_pct = (P_hyd_kW / P_in_kW) * 100.0

# 4. API 610 Verification Verdict
verdict = 'PASS' if 78.0 <= efficiency_pct <= 85.0 else 'CHECK'

print(f'FLOW_RATE_M3_H:{Q_m3_h}')
print(f'DIFFERENTIAL_HEAD_M:{H_m}')
print(f'HYDRAULIC_POWER_KW:{P_hyd_kW:.2f}')
print(f'MOTOR_INPUT_POWER_KW:{P_in_kW:.2f}')
print(f'HYDRAULIC_EFFICIENCY_PCT:{efficiency_pct:.2f}')
print(f'API_610_VERDICT:{verdict}')
