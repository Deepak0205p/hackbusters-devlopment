import os
import re
import math
import time
import yaml
from typing import Dict, Any, Optional, List, Pattern, Tuple

# MRPL & ONGC Enterprise Department Classification & Keyword Taxonomy
ENTERPRISE_DEPARTMENTS: Dict[str, Dict[str, Any]] = {
    "HSE_SAFETY": {
        "id": "HSE_SAFETY",
        "name": "Health, Safety & Environment (HSE / Fire)",
        "keywords": [
            "safety", "ppe", "helmet", "fire", "permit", "h2s", "toxic", "erdmp",
            "mockdrill", "hazard", "incident", "csb", "first aid", "fall arrest",
            "confined space", "hot work", "gas testing", "contractor worker"
        ]
    },
    "REFINERY_OPS": {
        "id": "REFINERY_OPS",
        "name": "Refinery Operations & Process Engineering",
        "keywords": [
            "furnace", "cdu", "vdu", "temperature", "pressure", "p&id", "pid",
            "pipeline", "radiant", "thermocouple", "flange", "psv", "shutdown",
            "startup", "boiler", "crude", "distillation", "flare", "mcr"
        ]
    },
    "MAINTENANCE_INSPECTION": {
        "id": "MAINTENANCE_INSPECTION",
        "name": "Mechanical, Electrical & Asset Reliability",
        "keywords": [
            "pump", "api 610", "vibration", "corrosion", "ultrasonic", "ut sensor",
            "er probe", "thickness", "impeller", "bearing", "overhaul", "coupon",
            "inspection", "wear ring", "npsh"
        ]
    },
    "MATERIALS_GEM": {
        "id": "MATERIALS_GEM",
        "name": "Materials, Contracts & GeM Procurement",
        "keywords": [
            "gem", "tender", "procurement", "contractor", "bid", "bidding",
            "vendor", "supplier", "earnest money", "emd", "purchase order",
            "po", "liquidated damages", "pre-qualification", "delivery schedule"
        ]
    },
    "ESG_SUSTAINABILITY": {
        "id": "ESG_SUSTAINABILITY",
        "name": "ESG, Environment & Sustainability",
        "keywords": [
            "brsr", "sustainability", "carbon", "water management", "emission",
            "biodiversity", "effluent", "etp", "greenhouse", "esg", "environmental"
        ]
    },
    "FINANCE_EMB": {
        "id": "FINANCE_EMB",
        "name": "Finance, Accounts & e-Measurement (e-MB)",
        "keywords": [
            "emb", "e-mb", "emeasurement", "measurement book", "billing", "invoice",
            "payment", "eic approval", "tax", "gst", "accounting", "running bill"
        ]
    },
    "CAG_AUDIT": {
        "id": "CAG_AUDIT",
        "name": "CAG & Statutory Audit Compliance",
        "keywords": [
            "cag", "audit", "statutory", "audit observation", "non-conformance",
            "compliance report", "audit finding", "internal audit"
        ]
    },
    "HR_ADMIN": {
        "id": "HR_ADMIN",
        "name": "Human Resources & Contractor Relations",
        "keywords": [
            "human rights", "child labour", "forced labour", "wages", "contract worker",
            "diversity", "code of conduct", "working hours", "leave", "welfare"
        ]
    },
    "VIGILANCE_ETHICS": {
        "id": "VIGILANCE_ETHICS",
        "name": "Vigilance, Ethics & Anti-Corruption",
        "keywords": [
            "whistle blower", "whistleblower", "anti-bribery", "corruption", "fraud",
            "vigilance", "complaint", "misconduct", "integrity pact", "gift policy"
        ]
    }
}

OUT_OF_SCOPE_DECLINE_MESSAGE = (
    "🏢 **MRPL & ONGC Enterprise Sovereign AI Workbench**\n\n"
    "Main keval **Mangalore Refinery and Petrochemicals Limited (MRPL)** aur **Oil and Natural Gas Corporation (ONGC)** "
    "ke departments aur refinery operations se sambandhit prashnon par sahayata pradan karne ke liye trained hoon:\n\n"
    "• **HSE & Fire/Safety**: Contractor safety, PPE rules, H2S emergency evacuation\n"
    "• **Refinery Operations**: CDU/Furnace parameters, P&ID instrumentation, operating limits\n"
    "• **Maintenance & Inspection**: API 610 pumps, corrosion UT sensors, asset reliability\n"
    "• **Contracts & GeM**: GeM tendering, vendor guidelines, safety pre-qualifications\n"
    "• **Finance & e-MB**: e-Measurement books, billing approvals, work verification\n"
    "• **ESG & Environment**: BRSR FY25, water conservation, emissions compliance\n"
    "• **Audit & Vigilance**: CAG audit compliance, Anti-Bribery, Whistle Blower policies\n"
    "• **HR & Contractor Welfare**: Labour policies, human rights, workforce rules\n\n"
    "⚠️ *Aapki query MRPL/ONGC refinery operations ya corporate compliance ke daayre se bahar hai. Kripya kisi sambandhit department se juda prashn puchen.*"
)


def detect_mrpl_ongc_department(prompt: str) -> Tuple[bool, Optional[Dict[str, Any]]]:
    """
    Evaluates whether a prompt falls within MRPL/ONGC enterprise departments.
    Returns (is_in_scope, matched_department_info).
    """
    p_lower = prompt.lower().strip()
    
    # Direct brand/entity mentions with word boundaries
    brand_keywords = ["mrpl", "ongc", "mangalore refinery", "refinery", "refineries", "sop", "cdu", "vdu"]
    has_explicit_brand = any(re.search(r'\b' + re.escape(bk) + r'\b', p_lower) for bk in brand_keywords)

    best_dept = None
    max_matches = 0

    for dept_key, dept_data in ENTERPRISE_DEPARTMENTS.items():
        matches = sum(1 for kw in dept_data["keywords"] if re.search(r'\b' + re.escape(kw) + r'\b', p_lower))
        if matches > max_matches:
            max_matches = matches
            best_dept = dept_data

    # Scope verdict: Needs either at least 1 strong department keyword match OR brand mention with operational context
    if max_matches >= 1:
        return True, best_dept
    
    if has_explicit_brand and len(p_lower.split()) >= 2:
        # Fallback to general HSE or Ops if refinery mentioned
        return True, ENTERPRISE_DEPARTMENTS["HSE_SAFETY"]

    # Greetings or capability queries are permitted as introductory interactions
    greetings = ["hello", "hi", "hey", "namaste", "good morning", "good evening", "who are you", "help", "capabilities"]
    if any(p_lower == g or p_lower.startswith(g + " ") for g in greetings):
        return True, None

    return False, None


class DynamicStage1Classifier:
    """
    Ultra-fast (< 2ms) deterministic regex and keyword rule matcher,
    configured dynamically at startup from models.yaml declarations.
    """
    def __init__(self, domain_patterns: Dict[str, List[Pattern]], domain_model_map: Dict[str, str]):
        self.domain_patterns = domain_patterns
        self.domain_model_map = domain_model_map

    def classify(self, prompt: str, has_attachments: bool = False) -> Optional[Dict[str, Any]]:
        # Hard Rule 1: Multimodal attachments trigger Vision Model if registered
        if has_attachments and "vision" in self.domain_model_map:
            return {
                "domain": "vision",
                "model_id": self.domain_model_map["vision"],
                "confidence": 100,
                "routed_by": "stage1_regex"
            }

        # Check domain patterns dynamically in order of priority
        priority_domains = ["coding", "reasoning", "vision"] + [
            d for d in self.domain_patterns.keys() if d not in ["coding", "reasoning", "vision", "general"]
        ] + (["general"] if "general" in self.domain_patterns else [])

        for domain in priority_domains:
            patterns = self.domain_patterns.get(domain, [])
            for pat in patterns:
                if pat.search(prompt):
                    model_id = self.domain_model_map.get(domain, "unknown")
                    confidence = 98 if domain in ["coding", "reasoning"] else (96 if domain == "vision" else 95)
                    return {
                        "domain": domain,
                        "model_id": model_id,
                        "confidence": confidence,
                        "routed_by": "stage1_regex"
                    }

        return None


class DynamicStage2Classifier:
    """
    Semantic keyword centroid fallback matching prompts against domain vocabularies,
    derived dynamically from models.yaml.
    """
    def __init__(self, domain_vocabulary: Dict[str, List[str]], domain_model_map: Dict[str, str], fallback_domain: str = "general"):
        self.domain_vocabulary = domain_vocabulary
        self.domain_model_map = domain_model_map
        self.fallback_domain = fallback_domain

    def classify(self, prompt: str) -> Dict[str, Any]:
        words = set(re.findall(r'\w+', prompt.lower()))
        scores = {}

        for domain, vocab in self.domain_vocabulary.items():
            overlap = len(words.intersection(set(vocab)))
            scores[domain] = overlap

        if not scores:
            best_domain = self.fallback_domain
            max_score = 0
        else:
            best_domain = max(scores, key=scores.get)
            max_score = scores[best_domain]

        if max_score == 0:
            best_domain = self.fallback_domain if self.fallback_domain in self.domain_model_map else (list(self.domain_model_map.keys())[0] if self.domain_model_map else "general")
            confidence = 85
        else:
            confidence = min(94, 80 + max_score * 4)

        return {
            "domain": best_domain,
            "model_id": self.domain_model_map.get(best_domain, "unknown"),
            "confidence": confidence,
            "routed_by": "stage2_semantic"
        }


class IntelligentRouter:
    """
    Two-Stage Hybrid Router:
    Builds domain-to-model routing table, regex lists, and domain centroids
    purely from models.yaml configuration with ZERO hardcoded model lists.
    Integrates MRPL & ONGC Enterprise Department classification.
    """
    MAX_PROMPT_LENGTH = 4000

    def __init__(self, config_path: Optional[str] = None):
        if config_path is None:
            config_path = os.path.join(os.path.dirname(__file__), "..", "config", "models.yaml")
        self.config_path = os.path.abspath(config_path)
        
        self.domain_model_map: Dict[str, str] = {}
        self.domain_patterns: Dict[str, List[Pattern]] = {}
        self.domain_vocabulary: Dict[str, List[str]] = {}
        self.fallback_domain: str = "general"

        self.reload_from_config()

    def reload_from_config(self):
        """Builds all routing maps and classifiers from models.yaml dynamically."""
        self.domain_model_map.clear()
        self.domain_patterns.clear()
        self.domain_vocabulary.clear()

        if os.path.exists(self.config_path):
            with open(self.config_path, "r", encoding="utf-8") as f:
                data = yaml.safe_load(f)

            for item in data.get("models", []):
                domain = item.get("domain")
                model_id = item.get("id")
                if not domain or not model_id:
                    continue

                # Ignore backup edge domains from primary domain map if main exists
                if item.get("tier") == "backup" and domain in self.domain_model_map:
                    continue

                self.domain_model_map[domain] = model_id

                # Compile regex patterns
                patterns = []
                for p_str in item.get("regex_patterns", []):
                    try:
                        patterns.append(re.compile(p_str))
                    except Exception:
                        pass
                if patterns:
                    self.domain_patterns[domain] = patterns

                # Store vocabulary keywords
                keywords = item.get("keywords", [])
                if keywords:
                    self.domain_vocabulary[domain] = [k.lower() for k in keywords]

        if "general" in self.domain_model_map:
            self.fallback_domain = "general"
        elif self.domain_model_map:
            self.fallback_domain = list(self.domain_model_map.keys())[0]

        self.stage1 = DynamicStage1Classifier(self.domain_patterns, self.domain_model_map)
        self.stage2 = DynamicStage2Classifier(self.domain_vocabulary, self.domain_model_map, self.fallback_domain)

    def route(self, prompt: str, has_attachments: bool = False) -> Dict[str, Any]:
        # 1. Sanitize input text bounds to protect downstream processors
        clean_prompt = prompt.strip()[:self.MAX_PROMPT_LENGTH]

        # 2. Check MRPL & ONGC Enterprise Department Scope
        is_in_scope, matched_dept = detect_mrpl_ongc_department(clean_prompt)

        if not clean_prompt and not has_attachments:
            return {
                "domain": self.fallback_domain,
                "model_id": self.domain_model_map.get(self.fallback_domain, "general"),
                "confidence": 90,
                "routed_by": "stage1_regex",
                "is_in_scope": True,
                "department": None
            }

        # 3. Stage 1: Deterministic Rule Matching
        decision = self.stage1.classify(clean_prompt, has_attachments=has_attachments)
        if decision:
            decision["is_in_scope"] = is_in_scope
            decision["department"] = matched_dept
            return decision

        # 4. Stage 2: Dense Semantic Fallback
        decision = self.stage2.classify(clean_prompt)
        decision["is_in_scope"] = is_in_scope
        decision["department"] = matched_dept
        return decision

# Global Singleton
intelligent_router = IntelligentRouter()
