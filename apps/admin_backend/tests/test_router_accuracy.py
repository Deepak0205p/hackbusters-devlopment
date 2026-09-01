import time
from apps.admin_backend.core.router import intelligent_router

BENCHMARK_PROMPTS = [
    # 1. Coding Tasks -> qwen2.5-coder-3b
    ("Write a python script to calculate centrifugal pump hydraulic power for flow=250, head=45", "coding", "qwen2.5-coder-3b"),
    ("def calculate_reynolds(density, velocity, diameter, viscosity): return (density * velocity * diameter) / viscosity", "coding", "qwen2.5-coder-3b"),
    ("Fix this Python IndexError traceback in the furnace calculation loop", "coding", "qwen2.5-coder-3b"),
    ("Generate a pandas script to aggregate crude oil throughput metrics by shift", "coding", "qwen2.5-coder-3b"),
    ("Calculate hydraulic power and operating efficiency for centrifugal charge pump with Flow = 450 m3/h", "coding", "qwen2.5-coder-3b"),

    # 2. Reasoning Tasks -> qwen3-4b
    ("Draft an urgent executive approval note for furnace emergency decoking turnaround", "reasoning", "qwen3-4b"),
    ("Evaluate SOP-MRPL-SAFETY-09 clause 4.2 compliance regarding hazardous gas thresholds", "reasoning", "qwen3-4b"),
    ("Perform root cause analysis on high tube skin temperature alarms and synthesize recommendations", "reasoning", "qwen3-4b"),
    ("Prepare formal management memo on turnaround scheduling strategy for Crude Distillation Unit", "reasoning", "qwen3-4b"),
    ("Draft an urgent executive approval note for Crude Distillation Unit furnace based on inspection report and verify compliance against MRPL SOPs", "reasoning", "qwen3-4b"),

    # 3. Vision Tasks -> qwen2-vl-2b
    ("Extract equipment tags and valve IDs from this scanned P&ID drawing", "vision", "qwen2-vl-2b"),
    ("Run OCR on the attached furnace inspection log sheet and read skin temperatures", "vision", "qwen2-vl-2b"),
    ("Identify transmitter tags and flow control valves in the diagram", "vision", "qwen2-vl-2b"),
    ("Read handwritten operator notes from the field maintenance log", "vision", "qwen2-vl-2b"),
    ("Analyze P&ID engineering drawing for Crude Pre-Flash Unit, extract all ISA 5.1 instrumentation tags", "vision", "qwen2-vl-2b"),

    # 4. General Tasks -> llama-3.2-3b
    ("Hello, what capabilities does the sovereign workbench offer?", "general", "llama-3.2-3b"),
    ("Summarize the key safety points in plain, simple English", "general", "llama-3.2-3b"),
    ("Good morning assistant, please format this bullet list", "general", "llama-3.2-3b")
]

def run_accuracy_benchmark():
    passed = 0
    total = len(BENCHMARK_PROMPTS)
    latencies = []

    print("=" * 70)
    print("  MRPL SOVEREIGN WORKBENCH - ROUTER ACCURACY BENCHMARK SUITE")
    print("=" * 70)

    for idx, (prompt, expected_domain, expected_model) in enumerate(BENCHMARK_PROMPTS, 1):
        t0 = time.perf_counter()
        result = intelligent_router.route(prompt)
        dt_ms = (time.perf_counter() - t0) * 1000
        latencies.append(dt_ms)

        is_domain_match = result["domain"] == expected_domain
        is_model_match = result["model_id"] == expected_model
        is_pass = is_domain_match and is_model_match

        if is_pass:
            passed += 1
            status_str = "[PASS]"
        else:
            status_str = "[FAIL]"

        short_prompt = prompt[:50] + "..." if len(prompt) > 50 else prompt
        print(f"{idx:02d}. {status_str} [{result['routed_by']:<15}] ({dt_ms:.3f}ms) -> {result['domain']:<9} ({result['model_id']}) | '{short_prompt}'")

    accuracy = (passed / total) * 100
    avg_latency = sum(latencies) / len(latencies)

    print("-" * 70)
    print(f"BENCHMARK RESULTS: {passed}/{total} PASSED ({accuracy:.1f}% ACCURACY)")
    print(f"AVERAGE ROUTING LATENCY: {avg_latency:.3f} ms (Target: < 2.0 ms)")
    print("=" * 70)

    assert passed == total, f"Benchmark failed: {total - passed} mismatches."
    return accuracy, avg_latency

if __name__ == "__main__":
    run_accuracy_benchmark()
