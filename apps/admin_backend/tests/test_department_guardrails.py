import asyncio
from apps.admin_backend.core.router import intelligent_router, detect_mrpl_ongc_department
from apps.admin_backend.agent.engine import agent_engine

def test_department_guardrails():
    print("=" * 80)
    print("  MRPL & ONGC ENTERPRISE DEPARTMENT GUARDRAILS & ROUTING TEST")
    print("=" * 80)

    # 1. Test Off-Topic Scope Rejection (Guardrail Checks)
    print("\n--- [1] OFF-TOPIC OUT-OF-SCOPE QUERIES (STRICT REJECTION) ---")
    off_topic_queries = [
        "Maths kya hai?",
        "Who is the president of USA?",
        "Write a poem about rain and love",
        "Explain quantum computing and black holes",
        "Cricket match score today"
    ]

    for q in off_topic_queries:
        is_in_scope, dept = detect_mrpl_ongc_department(q)
        decision = intelligent_router.route(q)
        print(f"Query: '{q}'")
        print(f"  • In-Scope Detected: {is_in_scope} (Expected: False)")
        print(f"  • Router is_in_scope: {decision['is_in_scope']}")
        assert is_in_scope is False
        assert decision["is_in_scope"] is False

    # 2. Test 9 Enterprise Departments Routing
    print("\n--- [2] ALL 9 MRPL & ONGC ENTERPRISE DEPARTMENTS IN-SCOPE QUERIES ---")
    dept_queries = [
        ("HSE_SAFETY", "What are the mandatory PPE safety helmet specifications for refinery contractor workers?"),
        ("REFINERY_OPS", "CDU-1 furnace radiant tube thermocouple TT-104 skin temperature limit and emergency shut-down SOP"),
        ("MAINTENANCE_INSPECTION", "API 610 centrifugal pump vibration limits and ultrasonic UT corrosion monitoring probes"),
        ("MATERIALS_GEM", "GeM portal tender contractor pre-qualification criteria and earnest money deposit EMD"),
        ("ESG_SUSTAINABILITY", "MRPL BRSR FY25 reporting sustainability water management and carbon emission reduction"),
        ("FINANCE_EMB", "e-Measurement Book e-MB contractor invoice billing and Engineer-in-Charge EIC approval workflow"),
        ("CAG_AUDIT", "CAG statutory audit report observations on refinery compliance and non-conformance"),
        ("HR_ADMIN", "Prohibition of child labour and forced labour under ONGC Human Rights Policy 2022"),
        ("VIGILANCE_ETHICS", "Whistle Blower policy protected disclosure and Anti-Bribery anti-corruption gift limits")
    ]

    for expected_dept_id, q in dept_queries:
        is_in_scope, dept = detect_mrpl_ongc_department(q)
        decision = intelligent_router.route(q)
        print(f"\nTarget Dept: [{expected_dept_id}]")
        print(f"  • Query: '{q[:75]}...'")
        print(f"  • In-Scope: {is_in_scope} (Expected: True)")
        print(f"  • Matched Dept: {dept['name'] if dept else 'None'}")
        assert is_in_scope is True
        assert dept is not None
        assert dept["id"] == expected_dept_id

    # 3. Live Agent Engine Streaming Execution on Off-Topic Query
    print("\n--- [3] LIVE AGENT ENGINE EXECUTION: OFF-TOPIC QUERY REJECTION ---")
    async def run_off_topic_stream():
        events = []
        async for event in agent_engine.execute_task("Maths kya hai?"):
            events.append(event)
        return events

    off_events = asyncio.run(run_off_topic_stream())
    print(f"Total stream events received: {len(off_events)}")
    routing_ev = next(e for e in off_events if e["event"] == "routing")
    final_ev = next(e for e in off_events if e["event"] == "final_answer")

    print(f"  • Routing is_in_scope: {routing_ev['is_in_scope']}")
    print(f"  • Final Answer Display Model: {final_ev['display_model']}")
    sanitized_snippet = final_ev['content'][:120].encode('ascii', errors='replace').decode('ascii')
    print(f"  • Final Answer Snippet: {sanitized_snippet}...")
    assert routing_ev["is_in_scope"] is False
    assert "MRPL & ONGC" in final_ev["content"]

    # 4. Live Agent Engine Streaming Execution on In-Scope Department Query
    print("\n--- [4] LIVE AGENT ENGINE EXECUTION: IN-SCOPE SAFETY QUERY ---")
    async def run_in_scope_stream():
        events = []
        async for event in agent_engine.execute_task(
            "What are the mandatory PPE safety helmet specifications for refinery contractor workers?"
        ):
            events.append(event)
        return events

    in_events = asyncio.run(run_in_scope_stream())
    in_routing = next(e for e in in_events if e["event"] == "routing")
    in_final = next(e for e in in_events if e["event"] == "final_answer")

    print(f"  • Routing is_in_scope: {in_routing['is_in_scope']}")
    print(f"  • Department Tag: {in_routing['department']}")
    print(f"  • Final Answer Length: {len(in_final['content'])} chars")
    assert in_routing["is_in_scope"] is True
    assert in_routing["department"] is not None

    print("\n" + "=" * 80)
    print("  ALL DEPARTMENT GUARDRAIL & ROUTING TESTS PASSED (100% VERIFIED)")
    print("=" * 80)

if __name__ == "__main__":
    test_department_guardrails()
