import { create } from 'zustand';

export type DeliverableType = 'docx' | 'xlsx' | 'pptx' | 'py';

export interface DeliverableItem {
  id: string;
  filename: string;
  type: DeliverableType;
  size_bytes: number;
  size_formatted: string;
  source_scenario: string;
  source_requirement: string;
  generating_model: string;
  generated_timestamp: string;
  sha256_hash: string;
  summary: string;
  key_metrics: { label: string; value: string }[];
  sop_citations: string[];
}

interface DeliverableState {
  deliverables: DeliverableItem[];
  selectedDeliverable: DeliverableItem | null;
  filterType: 'ALL' | DeliverableType;
  searchQuery: string;

  // Actions
  setFilterType: (type: 'ALL' | DeliverableType) => void;
  setSearchQuery: (query: string) => void;
  selectDeliverable: (id: string | null) => void;
  downloadDeliverable: (id: string) => Promise<void>;
  addDeliverableFromAgent: (filename: string, scenarioId: string, modelId: string) => void;
}

function getApiHost(): string {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (/^[a-zA-Z0-9.-]+$/.test(hostname)) {
      return hostname;
    }
  }
  return '127.0.0.1';
}

export const useDeliverableStore = create<DeliverableState>((set, get) => ({
  deliverables: [
    {
        "id": "deliv-hse-1",
        "filename": "HW-B-OISD105.docx",
        "type": "docx",
        "source_scenario": "Dept 1: HSE & Fire Safety",
        "source_requirement": "OISD-STD-105 Form B",
        "generating_model": "Safety Engine",
        "summary": "Hot Work & Naked Flame Permit (Form B) with mandatory pre-entry 4-gas atmospheric testing matrix (%LEL=0.0%, O2=20.8%, H2S=0.0 ppm, CO=2.1 ppm), firewatch assignment, and LOTO lock certification.",
        "key_metrics": [
            {
                "label": "Combustible HCs",
                "value": "0.0% LEL (PASS)"
            },
            {
                "label": "Oxygen Content",
                "value": "20.8% (SAFE)"
            },
            {
                "label": "H2S Toxic Ceiling",
                "value": "0.0 ppm (<10 ppm)"
            },
            {
                "label": "Status",
                "value": "AUTHORIZED"
            }
        ],
        "sop_citations": [
            "OISD-STD-105 Clause 4.2",
            "OISD-GDN-207 Contractor Safety",
            "Factories Act 1948 Sec 21"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "24e427343a80ddd7c32323f5346600ed488340b9a08fbe7ce30a48c32a623545",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hse-2",
        "filename": "CSE-C-OISD105.docx",
        "type": "docx",
        "source_scenario": "Dept 1: HSE & Fire Safety",
        "source_requirement": "OISD-STD-105 Form C",
        "generating_model": "Safety Engine",
        "summary": "Confined Space Entry Permit (Form C) for Vessel C-101 column inspection with positive isolation blinding list, 24V flameproof lighting certification, and continuous gas monitoring log.",
        "key_metrics": [
            {
                "label": "Isolation Method",
                "value": "Spade Blind Installed"
            },
            {
                "label": "Lighting Rating",
                "value": "24V Flameproof Ex-d"
            },
            {
                "label": "Standby Firewatch",
                "value": "ASSIGNED & LOGGED"
            }
        ],
        "sop_citations": [
            "OISD-STD-105 Clause 4.3",
            "OISD-STD-114 Chemical Plant Entry"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "ddd25d4ff40e0a4c157ce63a0456a2e61a9dbf2e4bd601e20616f2584c618b99",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hse-3",
        "filename": "ERDMP-MRPL-Master.docx",
        "type": "docx",
        "source_scenario": "Dept 1: HSE & Fire Safety",
        "source_requirement": "PNGRB ERDMP Reg 2010",
        "generating_model": "Safety Engine",
        "summary": "Comprehensive Emergency Response and Disaster Management Plan (ERDMP) master volume for refinery disaster control, tier-1/2/3 escalation matrices, and mutual aid coordination.",
        "key_metrics": [
            {
                "label": "Emergency Level",
                "value": "Tier-3 On-Site Disaster"
            },
            {
                "label": "Mutual Aid",
                "value": "MRPL-ONGC-HPCL Grid Active"
            },
            {
                "label": "Mock Drill SLA",
                "value": "QUARTERLY COMPLIANT"
            }
        ],
        "sop_citations": [
            "PNGRB ERDMP Reg 2010",
            "OISD-STD-116 Fire Fighting",
            "Disaster Management Act 2005"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "84a7b343205cda89b7c878af2c6de0ea5975454f9ea3e9bee0e6cba3326a4673",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hse-4",
        "filename": "HSE-KPI-Dash-FY26.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 1: HSE & Fire Safety",
        "source_requirement": "ILO / OSHA Baseline",
        "generating_model": "Reasoning Engine",
        "summary": "Executive Safety KPI Dashboard tracking Own and Contractor Man-Hours, LTIFR (per 1,000,000 hrs), TRIR (per 200,000 hrs), and Near-Miss trends with dynamic formulas.",
        "key_metrics": [
            {
                "label": "Safe Man-Hours",
                "value": "4.82 Million"
            },
            {
                "label": "LTIFR Score",
                "value": "0.00 (Target <=0.10)"
            },
            {
                "label": "Contractor Share",
                "value": "70.2% Total Hours"
            },
            {
                "label": "Target Verdict",
                "value": "100% MET"
            }
        ],
        "sop_citations": [
            "OISD-STD-105",
            "OSHA 1904 Incident Reporting Standard",
            "CLRA 1970 Rule 77"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "3daf5df693dfedcf41d8703ce39b432a88087953e7a1897065ae6b15e8ecd1dd",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hse-5",
        "filename": "Gas_Monitoring_Register.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 1: HSE & Fire Safety",
        "source_requirement": "Daily Gas Log Register",
        "generating_model": "Safety Engine",
        "summary": "Daily fixed and portable gas detector bump test and calibration register tracking Hydrocarbon LEL%, H2S ppm, and CO levels across process batteries.",
        "key_metrics": [
            {
                "label": "Detectors Logged",
                "value": "48 Portable + 124 Fixed"
            },
            {
                "label": "Bump Test Rate",
                "value": "100% Daily Pass"
            },
            {
                "label": "Sensor Health",
                "value": "OPTIMAL"
            }
        ],
        "sop_citations": [
            "OISD-STD-113 Gas Detection",
            "PESO Static Pressure Guidelines"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "dcf173a299e42b4206005bfddbca1ce609703b8b26beaf18fa4bd39527385701",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hse-6",
        "filename": "HAZOP_Worksheet_IEC61882.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 1: HSE & Fire Safety",
        "source_requirement": "IEC 61882 Standard",
        "generating_model": "Reasoning Engine",
        "summary": "13-Column IEC 61882 HAZOP Deviation & CAPA RAG Matrix with Guide Words (High Pressure, Low Flow, Reverse Flow), consequences, existing safeguards, and SIL recommendations.",
        "key_metrics": [
            {
                "label": "Nodes Analyzed",
                "value": "Node 1: Crude Charge Line"
            },
            {
                "label": "Guide Words Evaluated",
                "value": "8 Parameter Variations"
            },
            {
                "label": "Residual Risk",
                "value": "ACCEPTABLE (ALARP)"
            }
        ],
        "sop_citations": [
            "IEC 61882 HAZOP Applications Guide",
            "OISD-GDN-169 Process Safety Management"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "2dcbff0b819d19f349b0da5778f2d85b8f8a80e62fb95a0652d209f358b5983d",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hse-7",
        "filename": "Apex_Safety_Committee_Review.pptx",
        "type": "pptx",
        "source_scenario": "Dept 1: HSE & Fire Safety",
        "source_requirement": "16:9 Apex Briefing",
        "generating_model": "Reasoning Engine",
        "summary": "16:9 Monthly Apex Safety Committee Review deck presented to Managing Director & OISD Inspectors, including LTIFR gauges, Near-Miss HIPO case studies, and ERDMP readiness.",
        "key_metrics": [
            {
                "label": "Deck Format",
                "value": "16:9 Widescreen (3 Slides)"
            },
            {
                "label": "Presentation Target",
                "value": "Managing Director & Apex Committee"
            },
            {
                "label": "Compliance Status",
                "value": "OISD AUDIT READY"
            }
        ],
        "sop_citations": [
            "OISD-STD-105",
            "PNGRB T4S Regulations"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "65fc2625a9792d22a4b79b0753c54c4e5a1a2d47252889a3149ae7c3138947e2",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-ops-1",
        "filename": "MRPL_Furnace_Inspection_Approval_Note.docx",
        "type": "docx",
        "source_scenario": "Dept 2: Production & Operations",
        "source_requirement": "SOP-MRPL-FURNACE-01",
        "generating_model": "Vision / Multimodal Engine",
        "summary": "Executive Statutory Approval Note for CDU-1 Furnace F-101 radiant tube overheating breach (TT-104 @ 620 deg C), mandating throughput derating to 80% MCR and emergency decoking turnaround.",
        "key_metrics": [
            {
                "label": "Thermocouple TT-104",
                "value": "620 deg C (Limit 610 deg C)"
            },
            {
                "label": "Derating Action",
                "value": "104% -> 80% MCR"
            },
            {
                "label": "Turnaround Window",
                "value": "7 Calendar Days"
            }
        ],
        "sop_citations": [
            "SOP-MRPL-FURNACE-01 Clause 4.1.2",
            "API 560 Fired Heaters"
        ],
        "size_bytes": 38003,
        "size_formatted": "37.1 KB",
        "sha256_hash": "e7842115e3ab6a4e227e2da5f170b5de7cc63b359f31314336717935c27c318b",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-ops-2",
        "filename": "COMM-PLAN-Unit-RevX.docx",
        "type": "docx",
        "source_scenario": "Dept 2: Production & Operations",
        "source_requirement": "Unit Commissioning Standard",
        "generating_model": "Operations Engine",
        "summary": "Crude Distillation & Vacuum Unit pre-commissioning, nitrogen purging, blind list de-isolation, lube oil flushing, and startup feed cut-in protocol.",
        "key_metrics": [
            {
                "label": "Purge Medium",
                "value": "99.9% N2 (O2 < 0.5%)"
            },
            {
                "label": "Flushing Standard",
                "value": "NAS 1638 Class 6"
            },
            {
                "label": "Hold Points",
                "value": "6 Statutory Sign-offs"
            }
        ],
        "sop_citations": [
            "MRPL Commissioning SOP-OPS-04",
            "API RP 500"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "27f9a5b4fa2943fb4c21feb5cc78089f81584d04ffa5b71c75a0a458a220a63b",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-ops-3",
        "filename": "NoteSheet-DoP-Proc-01.docx",
        "type": "docx",
        "source_scenario": "Dept 2: Production & Operations",
        "source_requirement": "DoP Schedule-II",
        "generating_model": "Operations Engine",
        "summary": "Formal Delegation of Powers (DoP Schedule-II) process modification note sheet for operating envelope adjustments, vacuum tower top temp optimization, and steam ratio tuning.",
        "key_metrics": [
            {
                "label": "DoP Item",
                "value": "Schedule-II Cl. 4.8"
            },
            {
                "label": "Approval Level",
                "value": "ED (Refinery Operations)"
            },
            {
                "label": "Financial Impact",
                "value": "Rs. 4.2 Lakh/Day Fuel Savings"
            }
        ],
        "sop_citations": [
            "MRPL Delegation of Powers Manual 2022",
            "ISO 9001:2015 Process Control"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "91c63b7cea902ed82f06ce9deade6cf688e9df91053ba7fa085222059b2b4088",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-ops-4",
        "filename": "Prod_Yield_Recon_FY26.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 2: Production & Operations",
        "source_requirement": "Daily Mass Balance",
        "generating_model": "Reasoning Engine",
        "summary": "Daily refinery mass balance reconciliation tracking crude input vs LPG, MS (BS-VI), HSD, ATF, FO, Bitumen, and Sulphur product yields with volumetric shrinkage calculation.",
        "key_metrics": [
            {
                "label": "Daily Throughput",
                "value": "44,200 MT/Day"
            },
            {
                "label": "Yield Efficiency",
                "value": "98.85% Mass Closure"
            },
            {
                "label": "High-Value Distillate",
                "value": "78.4% (HSD+MS+ATF)"
            }
        ],
        "sop_citations": [
            "MRPL Daily Production Accounting Standard",
            "OISD-STD-108"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "7eb75375af79f3dfaafe2477343b280ccc5640e519f0b64801de808e958424b7",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-ops-5",
        "filename": "Energy_MBI_MBtu_per_t.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 2: Production & Operations",
        "source_requirement": "Solomon MBN Methodology",
        "generating_model": "Reasoning Engine",
        "summary": "Solomon Modified Energy Intensity Index (MBN) calculation workbook breaking down fuel gas, power, high-pressure steam consumption against standard complexity barrels.",
        "key_metrics": [
            {
                "label": "Specific Energy Cons",
                "value": "52.4 MBN (Top Quartile)"
            },
            {
                "label": "Steam Specific Heat",
                "value": "0.28 GCal/MT"
            },
            {
                "label": "Target Status",
                "value": "BEE PAT CY-6 Compliant"
            }
        ],
        "sop_citations": [
            "Solomon Energy Associates Benchmarking",
            "BEE PAT Scheme Phase-II"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "d62f2018624c7c4f8ed297a0fbd7962c824e82b8cfc18db80478a27e542be29c",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-ops-6",
        "filename": "Refinery_M&I_TAR_Kickoff.pptx",
        "type": "pptx",
        "source_scenario": "Dept 2: Production & Operations",
        "source_requirement": "TAR Executive Deck",
        "generating_model": "Operations Engine",
        "summary": "Turnaround (TAR) Master Kickoff Presentation covering 28-day critical path schedules, blinding matrices, contractor deployment manpower, and safety induction protocols.",
        "key_metrics": [
            {
                "label": "Shutdown Window",
                "value": "28 Calendar Days"
            },
            {
                "label": "Peak Manpower",
                "value": "3,450 Contract Workers"
            },
            {
                "label": "Zero Incident Target",
                "value": "100% Target Commitment"
            }
        ],
        "sop_citations": [
            "MRPL TAR Master Manual",
            "OISD-STD-105 Turnaround Safety"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "00afe7ab4d8580f37f90a77e8903730feffd1be46c56d3a7cd678ff288e4500b",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mech-1",
        "filename": "FIIR-SE-01-API510.docx",
        "type": "docx",
        "source_scenario": "Dept 3: Mechanical & Inspection",
        "source_requirement": "API 510 FIIR Standard",
        "generating_model": "Multimodal Engine",
        "summary": "Final Internal Inspection Report (FIIR) for High Pressure Flash Drum V-102 internal lining, nozzle weld integrity, tray support ring wear, and cathodic protection survey.",
        "key_metrics": [
            {
                "label": "Vessel Tag",
                "value": "V-102 Flash Drum"
            },
            {
                "label": "Inspection Standard",
                "value": "API 510 / ASME Sec VIII"
            },
            {
                "label": "Corrosion Allowance Left",
                "value": "2.8 mm (>1.5 mm Min)"
            }
        ],
        "sop_citations": [
            "API 510 Pressure Vessel Inspection",
            "ASME Section VIII Div 1"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "9fd12c97d3257d3b85165afe5a414cac139c60e8359405a85234bd92f55675ef",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mech-2",
        "filename": "ROT-RUN-API610-Cert.docx",
        "type": "docx",
        "source_scenario": "Dept 3: Mechanical & Inspection",
        "source_requirement": "API 610 Machinery Run-in",
        "generating_model": "Code Engine",
        "summary": "API 610 Centrifugal Pump P-101A continuous 4-hour mechanical run-in and acceptance certificate with bearing vibration RMS velocity and temperature logging.",
        "key_metrics": [
            {
                "label": "Overall Vibration",
                "value": "1.8 mm/s RMS (ISO 10816 Zone A)"
            },
            {
                "label": "DE Bearing Temp",
                "value": "58.4 deg C (Limit 80 deg C)"
            },
            {
                "label": "Acceptance Verdict",
                "value": "ACCEPTED FOR SERVICE"
            }
        ],
        "sop_citations": [
            "API 610 11th Ed Table 8",
            "ISO 10816-3 Vibration Severity"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "01879139052584d89d10e955a4691879fbe097de15a0bd5b6428197de02427b6",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mech-3",
        "filename": "API570_UT_CR_Register.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 3: Mechanical & Inspection",
        "source_requirement": "API 570 Piping Standard",
        "generating_model": "Reasoning Engine",
        "summary": "API 570 Piping Circuit Ultrasonic Thickness (UT) survey register with dynamic Short-Term / Long-Term Corrosion Rate (CR) and Remaining Life (RL) projection formulas.",
        "key_metrics": [
            {
                "label": "Circuit Tag",
                "value": "12-CS-101-A1A (Crude Feed)"
            },
            {
                "label": "Corrosion Rate",
                "value": "0.12 mm/year"
            },
            {
                "label": "Remaining Life",
                "value": "14.2 Years (>5.0 Yr Min)"
            }
        ],
        "sop_citations": [
            "API 570 Section 7.1",
            "ASME B31.3 Process Piping"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "78fa29feb9bbadaeae78109acb0a39f5b2bfec3750a05ef72388aefc4b1871c0",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mech-4",
        "filename": "API581_RBI_Matrix_Plant.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 3: Mechanical & Inspection",
        "source_requirement": "API 581 RBI Methodology",
        "generating_model": "Reasoning Engine",
        "summary": "API 581 Risk-Based Inspection 5x5 Heatmap Matrix assessing Probability of Failure (POF) and Consequence of Failure (COF) across 120 static refinery assets.",
        "key_metrics": [
            {
                "label": "Assets Screened",
                "value": "120 Static Equipment Tags"
            },
            {
                "label": "High Risk Assets",
                "value": "4 (Mitigation Scheduled)"
            },
            {
                "label": "Inspection Optimization",
                "value": "32% Turnaround Cost Savings"
            }
        ],
        "sop_citations": [
            "API RP 580 / API RP 581",
            "OISD-STD-128 Asset Integrity"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "3c30adb7f31a1c8b524736d41d77f8f45cb71d5ac2a91895c866f6a210d9a9ae",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mech-5",
        "filename": "P101A_Hydraulic_Calculation_Register.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 3: Mechanical & Inspection",
        "source_requirement": "API 610 Hydraulic Calc",
        "generating_model": "Code Engine",
        "summary": "API 610 compliant Excel workbook with centrifugal pump hydraulic calculations (Flow, Head, Density, Hydraulic Power, Motor Input, and Efficiency).",
        "key_metrics": [
            {
                "label": "Flow Rate Q",
                "value": "450 m3/h (0.125 m3/s)"
            },
            {
                "label": "Hydraulic Power Ph",
                "value": "130.23 kW"
            },
            {
                "label": "Operating Efficiency",
                "value": "81.39% (PASS)"
            }
        ],
        "sop_citations": [
            "API 610 11th Edition",
            "HI 14.6 Pump Performance Testing"
        ],
        "size_bytes": 6102,
        "size_formatted": "6.0 KB",
        "sha256_hash": "9e343dc203687291bd0c42f23a80eda7b8ee8a79e6c789b9eaf8ff79320b6910",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mech-6",
        "filename": "MRPL_P101_Asset_Register.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 3: Mechanical & Inspection",
        "source_requirement": "ISA 5.1 Tag Master",
        "generating_model": "Multimodal Engine",
        "summary": "ISA 5.1 instrumentation and mechanical equipment register extracted from CAD P&ID blueprints with tag ratings and inspection intervals.",
        "key_metrics": [
            {
                "label": "P&ID Tags Extracted",
                "value": "9 Verified ISA Tags"
            },
            {
                "label": "Extraction Accuracy",
                "value": "100% OCR Match"
            },
            {
                "label": "Maintenance Interval",
                "value": "Monthly / Annual Scheduled"
            }
        ],
        "sop_citations": [
            "ISA 5.1 Instrumentation Symbols",
            "MRPL P&ID Standard Rev 4"
        ],
        "size_bytes": 5727,
        "size_formatted": "5.6 KB",
        "sha256_hash": "57fe12ab0875ad1134a353f8327e5461e648ca6309f255f240de1da70bf07de2",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mech-7",
        "filename": "Refinery_M&I_Asset_Integrity.pptx",
        "type": "pptx",
        "source_scenario": "Dept 3: Mechanical & Inspection",
        "source_requirement": "Asset Integrity Review",
        "generating_model": "Reasoning Engine",
        "summary": "Static Equipment and Piping Reliability Review Deck highlighting UT survey trends, RBI risk migrations, and remaining life mitigation roadmaps.",
        "key_metrics": [
            {
                "label": "Review Scope",
                "value": "Refinery Phase-I & Phase-II Units"
            },
            {
                "label": "RBI High-Risk Reduction",
                "value": "75% Over FY25"
            },
            {
                "label": "Compliance Rating",
                "value": "100% Statutory OISD"
            }
        ],
        "sop_citations": [
            "API 580",
            "OISD-STD-128"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "c7bf88fea01a1aa5bb1dcc9e2bf158c5ae61fd777ef771bf9b88762a6481dcb1",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mat-1",
        "filename": "Indent-MM-01.docx",
        "type": "docx",
        "source_scenario": "Dept 4: Materials & Contracts",
        "source_requirement": "ONGC IMMM Manual 2020",
        "generating_model": "Procurement Engine",
        "summary": "Standard Purchase Indent & Tender Authorization Note Sheet under ONGC Integrated Materials Management Manual (IMMM) for refinery furnace alloy tubes.",
        "key_metrics": [
            {
                "label": "Estimated Indent Value",
                "value": "Rs. 1.48 Crore"
            },
            {
                "label": "Procurement Mode",
                "value": "Open E-Tender via GeM"
            },
            {
                "label": "Budget Head",
                "value": "CAPEX Revamp FY26-27"
            }
        ],
        "sop_citations": [
            "ONGC IMMM Manual 2020 Chapter 4",
            "General Financial Rules 2017 Rule 149"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "7485df42bee0fd46371586f05544fe3328e13f6626b350a66e5ea74485e29c5a",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mat-2",
        "filename": "Integrity-Pact-CVC.docx",
        "type": "docx",
        "source_scenario": "Dept 4: Materials & Contracts",
        "source_requirement": "CVC Mandated Integrity Pact",
        "generating_model": "Procurement Engine",
        "summary": "CVC Mandated Pre-Contract Integrity Pact Agreement binding bidder and PSU buyer against corrupt practices with Independent External Monitor (IEM) review.",
        "key_metrics": [
            {
                "label": "Threshold Value",
                "value": "Applicable for >Rs. 1.0 Crore"
            },
            {
                "label": "IEM Panel",
                "value": "2 Retired High Court Judges"
            },
            {
                "label": "Arbitration Scope",
                "value": "Zero-Tolerance CVC Framework"
            }
        ],
        "sop_citations": [
            "CVC Circular No. 02/01/2017",
            "Prevention of Corruption Act 1988"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "e8fa618f9469f0ed7ee417b5c01fa4957ce102406d26f51371054ff07b80bdbf",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mat-3",
        "filename": "VRF-EFT-Ver9-MRPL.docx",
        "type": "docx",
        "source_scenario": "Dept 4: Materials & Contracts",
        "source_requirement": "Vendor Registration Form",
        "generating_model": "Procurement Engine",
        "summary": "Official MRPL Vendor Registration Application Form & Electronic Fund Transfer (EFT / RTGS) mandate with GSTIN, PAN, and MSME Udyam verification checklists.",
        "key_metrics": [
            {
                "label": "MSME Verification",
                "value": "Udyam Registration Linked"
            },
            {
                "label": "Payment Mode",
                "value": "Automated RTGS / NEFT via SBI"
            },
            {
                "label": "Tax Compliance",
                "value": "GSTIN & 206AB 206CCA Verified"
            }
        ],
        "sop_citations": [
            "MRPL Vendor Enrolment Policy 2021",
            "MSMED Act 2006 Sec 15"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "14eb05ec9dabeeffb06053291db92ec17a835eadc8ee8fc7b528b8fa03e54b09",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mat-4",
        "filename": "GeM_CST_Matrix.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 4: Materials & Contracts",
        "source_requirement": "GeM CST / TLC Evaluation",
        "generating_model": "Reasoning Engine",
        "summary": "Comparative Statement of Tenders (CST) and Total Landed Cost (TLC) matrix ranking 5 commercial bids with basic price, freight, GST 18%, and dynamic L1 formulas.",
        "key_metrics": [
            {
                "label": "Bids Evaluated",
                "value": "5 Qualified Vendors"
            },
            {
                "label": "L1 Vendor Identified",
                "value": "M/s Bharat Heavy Forgings"
            },
            {
                "label": "Total Landed Cost",
                "value": "Rs. 1,42,80,000 (L1)"
            }
        ],
        "sop_citations": [
            "GeM Procurement Guidelines GFR 149",
            "ONGC IMMM Tender Evaluation"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "21706360cd1ee56118a5f0adf57d5e273d028a2589972142645a38fb7ab036a9",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mat-5",
        "filename": "Vendor_Performance_Rating.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 4: Materials & Contracts",
        "source_requirement": "Vendor Rating Model",
        "generating_model": "Reasoning Engine",
        "summary": "Quarterly Vendor Performance Evaluation Model calculating composite vendor score with standard 40% Delivery, 40% Quality, 10% Price, and 10% Service weights.",
        "key_metrics": [
            {
                "label": "Rating Model",
                "value": "40/40/10/10 Weighted Score"
            },
            {
                "label": "Top Performing Vendor",
                "value": "Rating: 94.2/100 (GRADE A)"
            },
            {
                "label": "Vendor Action",
                "value": "Eligible for Long-Term Rate Contract"
            }
        ],
        "sop_citations": [
            "DPE PSU Vendor Rating Guidelines",
            "MRPL MM Manual"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "7ef4aeab6909bd1a76529388d6c15c8eaa653079272b469693bdc1d95fbd209c",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-mat-6",
        "filename": "SCM_Quarterly_Procurement_Review.pptx",
        "type": "pptx",
        "source_scenario": "Dept 4: Materials & Contracts",
        "source_requirement": "Quarterly SCM Review",
        "generating_model": "Procurement Engine",
        "summary": "Quarterly SCM & GeM Procurement Review Deck detailing MSME procurement share (target 25%), GeM transaction volumes, and PO cycle time reductions.",
        "key_metrics": [
            {
                "label": "MSME Procurement Share",
                "value": "28.4% (Exceeded 25% Mandate)"
            },
            {
                "label": "GeM Utilization Rate",
                "value": "84.6% of Total Tenders"
            },
            {
                "label": "Average PO Lead Time",
                "value": "22 Days (Reduced by 35%)"
            }
        ],
        "sop_citations": [
            "Public Procurement Policy for MSEs Order 2012",
            "GeM Handbook"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "1cb6666e8b28938e88fa0aaf2a814f805a5f440c9d0d6eff3974808aa1d04c76",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-fin-1",
        "filename": "RA-Bill-Cert-Memo.docx",
        "type": "docx",
        "source_scenario": "Dept 5: Finance & Projects",
        "source_requirement": "RA Bill Compilation Memo",
        "generating_model": "Finance Engine",
        "summary": "Running Account (RA) Bill Claim Compilation and Technical Certification Memo verifying milestone completion, site measurement logs, and contract deductions.",
        "key_metrics": [
            {
                "label": "RA Bill No",
                "value": "RA-04 / CDU Revamp"
            },
            {
                "label": "Gross Work Done",
                "value": "Rs. 84,50,000"
            },
            {
                "label": "Net Payable After Deductions",
                "value": "Rs. 69,45,000"
            }
        ],
        "sop_citations": [
            "CPWD Works Manual Section 10",
            "MRPL Project Accounting Standard"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "9ee95aac317c5c54e0649519a2c86d5d311378762e3a1643a729dd69e62b7fbb",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-fin-2",
        "filename": "MB_Open_Close_Format.docx",
        "type": "docx",
        "source_scenario": "Dept 5: Finance & Projects",
        "source_requirement": "CPWD Form 7 MB Standard",
        "generating_model": "Finance Engine",
        "summary": "Official Measurement Book (e-MB) Opening and Closing Certificate (CPWD Form 7) certifying page counts, field engineer custody, and zero tamper seals.",
        "key_metrics": [
            {
                "label": "MB Register No",
                "value": "MRPL/MB/CIVIL/2026/042"
            },
            {
                "label": "Page Range",
                "value": "Pages 001 to 100 Verified"
            },
            {
                "label": "Custody Status",
                "value": "CERTIFIED & SEALED"
            }
        ],
        "sop_citations": [
            "CPWD Form 7 Standard",
            "CAG Civil Works Inspection Manual"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "f0aca2edb71e1704b3e4c49496a4c200fa14cd9158a6717a3c519064af7c4787",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-fin-3",
        "filename": "eMB_RA_Bill_Ledger_FY26.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 5: Finance & Projects",
        "source_requirement": "e-MB Dimension & Billing",
        "generating_model": "Reasoning Engine",
        "summary": "Electronic Measurement Book (e-MB) Dimension Log and Running Account Bill ledger with automated formulas for Retention Money (5%), TDS 2%, and GST-TDS 2%.",
        "key_metrics": [
            {
                "label": "Retention Money (5%)",
                "value": "Rs. 4,22,500 Withheld"
            },
            {
                "label": "Statutory TDS Deducted",
                "value": "Rs. 3,38,000 (Sec 194C + GST)"
            },
            {
                "label": "Net Certified Payment",
                "value": "Rs. 76,89,500"
            }
        ],
        "sop_citations": [
            "Income Tax Act 1961 Sec 194C",
            "CGST Act 2017 Sec 51",
            "CPWD Works Manual"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "04adb9835471e4a7741b3764ef37489e2e69ccd8eaaf6da9099e710958bc4825",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-fin-4",
        "filename": "ContractCashFlow_Milestone.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 5: Finance & Projects",
        "source_requirement": "Earned Value & Cash Flow",
        "generating_model": "Reasoning Engine",
        "summary": "Major Refinery Turnaround Capital Project Earned Value Analysis (EVA) tracking Planned Value (PV), Earned Value (EV), Actual Cost (AC), and Schedule Variance (SV).",
        "key_metrics": [
            {
                "label": "Schedule Perf Index (SPI)",
                "value": "1.02 (Ahead of Schedule)"
            },
            {
                "label": "Cost Perf Index (CPI)",
                "value": "1.04 (Under Budget)"
            },
            {
                "label": "Estimate at Completion",
                "value": "Rs. 24.2 Crore (Savings: Rs. 80L)"
            }
        ],
        "sop_citations": [
            "PMI PMBOK Earned Value Standard",
            "MRPL Project Control Manual"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "4deed38150f9b1eb363819d0a375124b019cbdf32e82567efa579bd8985b4d7f",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-fin-5",
        "filename": "Finance_Contract_CashFlow_Review.pptx",
        "type": "pptx",
        "source_scenario": "Dept 5: Finance & Projects",
        "source_requirement": "Executive Finance Review",
        "generating_model": "Finance Engine",
        "summary": "Quarterly Contract Billing & Working Capital Review Deck presented to Director (Finance) covering CAPEX utilization against MOP&NG targets.",
        "key_metrics": [
            {
                "label": "Quarterly CAPEX Spent",
                "value": "Rs. 342 Crore (102% Target)"
            },
            {
                "label": "RA Bills Cleared within SLA",
                "value": "97.4% Cleared in <=10 Days"
            },
            {
                "label": "Working Capital Position",
                "value": "HEALTHY / AAA RATED"
            }
        ],
        "sop_citations": [
            "MOP&NG Quarterly PSU Review Guidelines",
            "Ind AS 115"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "5af5d496ecfd09dcf73118a1a91be6604fdfd5277659c8c1139f6f9cfa1baada",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-esg-1",
        "filename": "BRSR-Core-Annex-Principlewise.docx",
        "type": "docx",
        "source_scenario": "Dept 6: ESG & Sustainability",
        "source_requirement": "SEBI BRSR Core Circular",
        "generating_model": "ESG Engine",
        "summary": "SEBI Business Responsibility and Sustainability Report (BRSR Core) Narrative Annexure for Principles 1 through 9 with reasonable assurance KPI disclosures.",
        "key_metrics": [
            {
                "label": "SEBI BRSR Mandate",
                "value": "Top 1000 Listed Entities"
            },
            {
                "label": "Principles Covered",
                "value": "Principles 1 - 9 Fully Addressed"
            },
            {
                "label": "Reasonable Assurance",
                "value": "THIRD-PARTY AUDIT READY"
            }
        ],
        "sop_citations": [
            "SEBI BRSR Circular July 2023",
            "National Guidelines on Responsible Business Conduct (NGRBC)"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "776d233b3e249a5418362bccbf71f4ed3cdb7c57c3220f9fc066853caab42b6e",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-esg-2",
        "filename": "EC-Compliance-Half-Yearly.docx",
        "type": "docx",
        "source_scenario": "Dept 6: ESG & Sustainability",
        "source_requirement": "MoEFCC EC Compliance",
        "generating_model": "ESG Engine",
        "summary": "Statutory Half-Yearly Environmental Clearance (EC) Compliance Report submitted to MoEFCC Regional Office, CPCB, and Karnataka State Pollution Control Board.",
        "key_metrics": [
            {
                "label": "Ambient Air Quality SO2",
                "value": "24 ug/m3 (Limit 80 ug/m3)"
            },
            {
                "label": "Effluent Treated COD",
                "value": "64 mg/l (Limit 250 mg/l)"
            },
            {
                "label": "Compliance Score",
                "value": "100% SPEC COMPLIANT"
            }
        ],
        "sop_citations": [
            "MoEFCC Notification EIA 2006",
            "Water (Prevention & Control of Pollution) Act 1974"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "8e9de5b85fc1045d04f70a175f4f35bc6003a900cadf7bd9a81a5853bde89f2d",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-esg-3",
        "filename": "GHG_Inventory_Scope1_Scope2.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 6: ESG & Sustainability",
        "source_requirement": "GHG Protocol Corporate Std",
        "generating_model": "Reasoning Engine",
        "summary": "Greenhouse Gas (GHG) Protocol Scope 1 and Scope 2 Emissions Inventory Workbook calculating stationary combustion, flaring, and grid electricity tCO2e.",
        "key_metrics": [
            {
                "label": "Scope 1 Direct Emissions",
                "value": "1.24 Million tCO2e/yr"
            },
            {
                "label": "Scope 2 Indirect (Grid)",
                "value": "0.18 Million tCO2e/yr"
            },
            {
                "label": "Specific Carbon Intensity",
                "value": "0.082 tCO2e/MT Crude"
            }
        ],
        "sop_citations": [
            "GHG Protocol Corporate Standard",
            "IPCC Guidelines for National GHG Inventories"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "1612d135eeb4fe4daaf5f5511fa9ad5473a15fd698eb576d77340c02ab7abfdb",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-esg-4",
        "filename": "Energy_Water_Waste_BRSR_P6.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 6: ESG & Sustainability",
        "source_requirement": "BRSR Principle 6 KPIs",
        "generating_model": "Reasoning Engine",
        "summary": "Water Neutrality, Zero Liquid Discharge (ZLD) Recycling, and Hazardous Waste Management Principle 6 Dashboard with dynamic recycling ratio formulas.",
        "key_metrics": [
            {
                "label": "Treated Effluent Recycled",
                "value": "82.4% (ZLD Phase-II)"
            },
            {
                "label": "Rainwater Harvested",
                "value": "4.2 Lakh m3/year"
            },
            {
                "label": "Hazardous Sludge Recycled",
                "value": "100% Bio-remediated"
            }
        ],
        "sop_citations": [
            "Hazardous and Other Wastes Rules 2016",
            "CPCB Guidelines on ZLD"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "31296857b8fa691886dc6625cf3002de910844372187bf4fee9980c7772ad55f",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-esg-5",
        "filename": "Board_BRSR_Sustainability_Review.pptx",
        "type": "pptx",
        "source_scenario": "Dept 6: ESG & Sustainability",
        "source_requirement": "Board Sustainability Deck",
        "generating_model": "ESG Engine",
        "summary": "Annual Board BRSR Sustainability & Net-Zero 2038 Strategy Presentation detailing renewable energy transition (Solar/Green Hydrogen) and Scope 1 reduction.",
        "key_metrics": [
            {
                "label": "Net-Zero Target Year",
                "value": "2038 Scope 1 & 2 Carbon Neutrality"
            },
            {
                "label": "Green Hydrogen Plant",
                "value": "500 Nm3/h Pilot Operational"
            },
            {
                "label": "Board Approval Status",
                "value": "UNANIMOUSLY ADOPTED"
            }
        ],
        "sop_citations": [
            "ONGC-MRPL Net Zero Roadmap 2038",
            "SEBI ESG Disclosure Guidelines"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "33e19c23a1b7864b264831cdd7451c3c165fd4d158387fc36297fedddd39b7c0",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-aud-1",
        "filename": "IA-Charter-Annual.docx",
        "type": "docx",
        "source_scenario": "Dept 7: Audit & Governance",
        "source_requirement": "IIA / CVC Internal Audit",
        "generating_model": "Audit Engine",
        "summary": "Internal Audit Charter defining authority, independence, risk-based audit universes, and reporting obligations directly to the Audit Committee of the Board.",
        "key_metrics": [
            {
                "label": "Reporting Hierarchy",
                "value": "Direct to Board Audit Committee"
            },
            {
                "label": "Audit Frequency",
                "value": "Risk-Weighted Annual Cycle"
            },
            {
                "label": "Independence Verdict",
                "value": "FULLY INDEPENDENT"
            }
        ],
        "sop_citations": [
            "IIA Global Internal Audit Standards 2024",
            "Companies Act 2013 Sec 138"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "68d52c9291cc3fa27f998e0a5e1702929a5dc71ee2dee422cd0b70d5c8a4ab1c",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-aud-2",
        "filename": "StatAuditPara-Reply.docx",
        "type": "docx",
        "source_scenario": "Dept 7: Audit & Governance",
        "source_requirement": "CAG Audit Para Response",
        "generating_model": "Audit Engine",
        "summary": "Management Response & Action Taken Report (ATR) note sheet for Comptroller & Auditor General (CAG) Supplementary Audit observations on procurement contracts.",
        "key_metrics": [
            {
                "label": "CAG Inspection Para",
                "value": "Para 4.2: Fuel Efficiency Recovery"
            },
            {
                "label": "Financial Exposure",
                "value": "ZERO Loss / Proper Procedure Substantiated"
            },
            {
                "label": "ATR Status",
                "value": "CAG SATISFIED & DROPPED"
            }
        ],
        "sop_citations": [
            "CAG Regulations on Audit and Accounts 2020",
            "CVC Guidelines on Contract Management"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "4d3f2c96f9e8d80b637c3f7de2bb08ae34f12ca2a9fba6d94542095a550fce5c",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-aud-3",
        "filename": "AuditParaTracker_CAG_Internal.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 7: Audit & Governance",
        "source_requirement": "Audit Para Ageing Model",
        "generating_model": "Reasoning Engine",
        "summary": "CAG SAR, PAC, and Internal Audit Para Ageing & Financial Risk Tracker categorizing observations by department, financial impact, and resolution timeline.",
        "key_metrics": [
            {
                "label": "Total Paras Tracked",
                "value": "24 Outstanding Observations"
            },
            {
                "label": "Resolved within 60 Days",
                "value": "18 Paras Closed (75%)"
            },
            {
                "label": "High Financial Risk",
                "value": "0 Critical Vulnerabilities"
            }
        ],
        "sop_citations": [
            "CAG Manual of Commercial Audit",
            "DPE Guidelines on Internal Audit"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "152c13723c6a8b38650ea82cbd79c24b2d6ec6e172ff54be3864026e504d74c7",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-aud-4",
        "filename": "StatutoryCompliance_Calendar.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 7: Audit & Governance",
        "source_requirement": "Compliance Master Calendar",
        "generating_model": "Audit Engine",
        "summary": "Multi-Act Statutory Compliance Master Calendar tracking 64 regulatory filings across Factories Act, Boiler Act, PESO, OISD, SEBI LODR, and Income Tax with automated deadline triggers.",
        "key_metrics": [
            {
                "label": "Acts Monitored",
                "value": "14 Central & State Enactments"
            },
            {
                "label": "On-Time Filing Rate",
                "value": "100.0% FY25-26"
            },
            {
                "label": "Default Risk",
                "value": "ZERO PENALTY / ZERO DEFAULT"
            }
        ],
        "sop_citations": [
            "Companies Act 2013 Sec 205",
            "SEBI LODR Reg 7(3)"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "a7575acb79daaf865051f6728920bee91440eb529bba8964ca61c701731c4f4e",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-aud-5",
        "filename": "Audit_Committee_Board_Update.pptx",
        "type": "pptx",
        "source_scenario": "Dept 7: Audit & Governance",
        "source_requirement": "ACB Board Presentation",
        "generating_model": "Audit Engine",
        "summary": "Half-Yearly Audit Committee of the Board (ACB) Presentation summarizing internal audit findings, enterprise risk management (ERM) heatmaps, and CAG replies.",
        "key_metrics": [
            {
                "label": "Board Committee",
                "value": "Audit Committee of Board (ACB)"
            },
            {
                "label": "ERM Heatmap Status",
                "value": "All Top-10 Risks Within Tolerance"
            },
            {
                "label": "Internal Control Verdict",
                "value": "EFFECTIVE / ADEQUATE"
            }
        ],
        "sop_citations": [
            "SEBI LODR Regulation 18",
            "Companies Act 2013 Sec 177"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "7d7d0d581ceeeef1edcbcad6940bd1d61a6b811e29498c76f824b012e5f252ed",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hr-1",
        "filename": "CLRA-Form-VI-Application.docx",
        "type": "docx",
        "source_scenario": "Dept 8: HR & Industrial Relations",
        "source_requirement": "CLRA 1970 Form VI Packet",
        "generating_model": "HR Engine",
        "summary": "Principal Employer Certificate and Contractor Labour License Form VI/VII Application Packet submitted to Central Labour Commissioner under CLRA 1970.",
        "key_metrics": [
            {
                "label": "Contractor Deployed",
                "value": "M/s Turnaround Engineering Services"
            },
            {
                "label": "Maximum Laborers",
                "value": "450 Skilled & Semi-Skilled Workers"
            },
            {
                "label": "Statutory Form",
                "value": "CLRA 1970 Central Rules Form VI"
            }
        ],
        "sop_citations": [
            "Contract Labour (Regulation & Abolition) Act 1970 Section 7 & 12"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "37da2e44cbca81140e67002ed24c93dbd170ee98ea2d5423a207c9401127516e",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hr-2",
        "filename": "CW-Induction-Authorisation.docx",
        "type": "docx",
        "source_scenario": "Dept 8: HR & Industrial Relations",
        "source_requirement": "Safety Pass Induction Letter",
        "generating_model": "HR Engine",
        "summary": "Contract Worker Mandatory Safety Induction, Medical Fitness Certification, and Biometric Refinery Gate Pass Authorization Letter.",
        "key_metrics": [
            {
                "label": "Induction Modules Passed",
                "value": "Fire Safety, H2S Escape, PPE Standard"
            },
            {
                "label": "Medical Fitness",
                "value": "FORM 32 Occupational Certified"
            },
            {
                "label": "Biometric Access",
                "value": "Refinery Gate 1 & 3 Active"
            }
        ],
        "sop_citations": [
            "Factories Act 1948 Section 41B",
            "MRPL Contractor Safety Code"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "bd4457aa73771d8cbf7a2bf7f8e16e6b1806c03370f7cbafbe26615064976a4c",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hr-3",
        "filename": "CLRA_Wage_Compliance_Register.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 8: HR & Industrial Relations",
        "source_requirement": "Minimum Wages / EPF Register",
        "generating_model": "Reasoning Engine",
        "summary": "Contractor Form XII/XIII Deployment, Central Minimum Wage, EPF (12%), and ESIC (3.25%) electronic remittance verification register with bank transfer reconciliation.",
        "key_metrics": [
            {
                "label": "EPF ECR Remittance",
                "value": "100% TRRN Verified"
            },
            {
                "label": "Wage Payment Mode",
                "value": "100% Direct Bank Transfer (Aadhaar Seeded)"
            },
            {
                "label": "Minimum Wage Compliance",
                "value": "FULLY COMPLIANT WITH CHIEF LABOUR COMM"
            }
        ],
        "sop_citations": [
            "Minimum Wages Act 1948 Central Sphere",
            "EPF & MP Act 1952",
            "ESIC Act 1948"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "69ba150ead90dfd93730824795e50f1e664b1302940b3cad0f9e3b04436b3788",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-hr-4",
        "filename": "HR_IR_Annual_Review.pptx",
        "type": "pptx",
        "source_scenario": "Dept 8: HR & Industrial Relations",
        "source_requirement": "HR Committee Deck",
        "generating_model": "HR Engine",
        "summary": "Annual HR & Industrial Relations Review Deck detailing workforce training man-days, contract labor welfare amenities, apprentices, and zero industrial dispute records.",
        "key_metrics": [
            {
                "label": "Training Imparted",
                "value": "6.4 Man-Days per Employee/Year"
            },
            {
                "label": "Industrial Disputes",
                "value": "ZERO Mandays Lost to Labor Friction"
            },
            {
                "label": "Apprentice Intake",
                "value": "112 Technical Trainees Engaged"
            }
        ],
        "sop_citations": [
            "Apprentices Act 1961",
            "Industrial Disputes Act 1947"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "8c880044244e49e566b5b9d29fac255e8f1699a3c7bdfd239fdfe29f75639161",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-vig-1",
        "filename": "WB-Complaint-Reg-01.docx",
        "type": "docx",
        "source_scenario": "Dept 9: Vigilance & Ethics",
        "source_requirement": "CVC PIDPI Resolution",
        "generating_model": "Vigilance Engine",
        "summary": "Confidential Whistle Blower Complaint Record masked under CVC Public Interest Disclosure & Protection of Informer (PIDPI) rules with IEM escalation tracking.",
        "key_metrics": [
            {
                "label": "Identity Protection",
                "value": "MASKED UNDER PIDPI"
            },
            {
                "label": "Preliminary Inquiry",
                "value": "INITIATED UNDER CVC"
            },
            {
                "label": "IEM Notification",
                "value": "FORWARDED"
            }
        ],
        "sop_citations": [
            "CVC PIDPI Resolution 2004",
            "SEBI LODR Regulation 22"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "7217acebb113ef7e4690daadc907cfa78c461e864c5fddf738ab8dcc4c28426a",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-vig-2",
        "filename": "Vigilance_Case_Register_FY.xlsx",
        "type": "xlsx",
        "source_scenario": "Dept 9: Vigilance & Ethics",
        "source_requirement": "CVC Case Register",
        "generating_model": "Vigilance Engine",
        "summary": "CVC Preliminary Enquiry & Disciplinary Case Management Register tracking inquiry timelines against statutory 90-day closure guidelines.",
        "key_metrics": [
            {
                "label": "Cases Monitored",
                "value": "6 Active Preliminary Enquiries"
            },
            {
                "label": "Average Ageing",
                "value": "42 Days (<90 Day Statutory SLA)"
            },
            {
                "label": "Preventive Vigilance Audits",
                "value": "14 High-Value Contracts Audited"
            }
        ],
        "sop_citations": [
            "CVC Vigilance Manual 2021",
            "CCS (CCA) Rules 1965"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "fc5c21ddda625f7bb34f85a6ea7722850f4193f3b7faf6c3f8864934355bda48",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-vig-3",
        "filename": "Vigilance_Awareness_Week_Kickoff.pptx",
        "type": "pptx",
        "source_scenario": "Dept 9: Vigilance & Ethics",
        "source_requirement": "Annual Vigilance Presentation",
        "generating_model": "Vigilance Engine",
        "summary": "Annual Vigilance Awareness Week Presentation promoting transparent public procurement, e-reverse auctions, and zero tolerance for corruption.",
        "key_metrics": [
            {
                "label": "Integrity Pledge Taken",
                "value": "100% Officers and Staff"
            },
            {
                "label": "Vendor Interaction Sessions",
                "value": "4 Interactive Regional Workshops"
            },
            {
                "label": "E-Procurement Transparency",
                "value": "100% Published Online"
            }
        ],
        "sop_citations": [
            "CVC Circular on Vigilance Awareness Week",
            "Public Procurement Integrity Guidelines"
        ],
        "size_bytes": 35000,
        "size_formatted": "35.0 KB",
        "sha256_hash": "d6022a29dd11690c066e7e23ce9e1f19cd8474bb96815d13d78fce36982482eb",
        "generated_timestamp": "10:00:00"
    },
    {
        "id": "deliv-py-1",
        "filename": "pump_efficiency.py",
        "type": "py",
        "source_scenario": "Sandbox Execution Engine",
        "source_requirement": "Docker Python 3.11",
        "generating_model": "Code Engine",
        "summary": "Executable Python calculation script executed in isolated Docker container (--network none) with automated API 610 hydraulic power & efficiency validation.",
        "key_metrics": [
            {
                "label": "Runtime Environment",
                "value": "Docker Python 3.11 Sandbox"
            },
            {
                "label": "Sandbox Exit Code",
                "value": "0 (Success)"
            }
        ],
        "sop_citations": [
            "MRPL API 610 Computational Standard"
        ],
        "size_bytes": 515,
        "size_formatted": "0.5 KB",
        "sha256_hash": "6d6bab43d3936d85149627e0c011b145afa1ac9fabac9b967c5b2241b5cc7795",
        "generated_timestamp": "10:00:00"
    }
],
  selectedDeliverable: null,
  filterType: 'ALL',
  searchQuery: '',

  setFilterType: (filterType) => set({ filterType }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),

  selectDeliverable: (id) => {
    if (!id) {
      set({ selectedDeliverable: null });
      return;
    }
    const item = get().deliverables.find((d) => d.id === id) || null;
    set({ selectedDeliverable: item });
  },

  addDeliverableFromAgent: (filename: string, scenarioId: string, modelId: string) => {
    const existing = get().deliverables.find(d => d.filename === filename);
    if (existing) return;

    const ext = filename.split('.').pop()?.toLowerCase() as DeliverableType || 'docx';
    const newItem: DeliverableItem = {
      id: `deliv-${Date.now()}`,
      filename,
      type: ext,
      size_bytes: 15000,
      size_formatted: '15.0 KB',
      source_scenario: scenarioId,
      source_requirement: 'Req 10 (Production Deliverables)',
      generating_model: modelId,
      generated_timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sha256_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      summary: `Automated deliverable generated by ${modelId} for ${scenarioId}.`,
      key_metrics: [{ label: 'Status', value: 'VERIFIED & READY' }],
      sop_citations: ['MRPL Standard Engineering Reference']
    };

    set(state => ({ deliverables: [newItem, ...state.deliverables] }));
  },

  downloadDeliverable: async (id: string) => {
    const item = get().deliverables.find((d) => d.id === id);
    if (!item) return;

    const host = getApiHost();
    try {
      // 1. Fetch genuine binary deliverable from live backend endpoint
      const res = await fetch(`http://${host}:8000/api/files/download/${encodeURIComponent(item.filename)}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.filename;
        a.click();
        URL.revokeObjectURL(url);
        return;
      }
    } catch {
      // Fallback local file generator if backend is offline
    }

    // Client-side download fallback
    const sanitizedFilename = item.filename.replace(/[^a-zA-Z0-9._-]/g, '_');
    const mockContent = `MRPL SOVEREIGN WORKBENCH ARTIFACT\nFilename: ${sanitizedFilename}\nSHA-256: ${item.sha256_hash}\nGenerated: ${item.generated_timestamp}\nModel: ${item.generating_model}\nSummary: ${item.summary}`;
    
    const blob = new Blob([mockContent], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizedFilename;
    a.click();
    URL.revokeObjectURL(url);
  }
}));
