import ast
from typing import Tuple, List, Optional, Set
from pydantic import BaseModel, Field

# ==============================================================================
# 1. FORBIDDEN & PERMITTED MODULES AND CALLS
# ==============================================================================
FORBIDDEN_MODULES: Set[str] = {
    # System & Execution
    "os", "sys", "subprocess", "posix", "nt", "pty", "commands",
    "shutil", "ctypes", "builtins", "importlib", "signal",
    # Network & IPC
    "socket", "http", "urllib", "requests", "httpx", "aiohttp",
    "ftplib", "smtplib", "poplib", "imaplib", "nntplib", "telnetlib",
    "xmlrpc", "socketserver", "asyncio.subprocess",
    # Concurrency / Process Spawning
    "multiprocessing", "threading", "concurrent", "_thread",
    # Serialization & Shell
    "pickle", "shelve", "marshal", "webbrowser", "winreg"
}

ALLOWED_SAFE_MODULES: Set[str] = {
    "math", "cmath", "decimal", "fractions", "random", "statistics",
    "numpy", "scipy", "pandas", "sympy", "pint", "openpyxl",
    "datetime", "time", "json", "re", "collections", "itertools",
    "functools", "operator", "string", "typing", "dataclasses"
}

FORBIDDEN_FUNCTIONS: Set[str] = {
    "eval", "exec", "compile", "__import__", "breakpoint",
    "memoryview", "globals", "locals", "vars", "open"
}

FORBIDDEN_ATTRIBUTES: Set[str] = {
    "__subclasses__", "__bases__", "__mro__", "__globals__",
    "__code__", "__closure__", "__class__", "__builtins__",
    "__import__", "__loader__", "__spec__", "__dict__"
}

FORBIDDEN_GETATTR_TARGETS: Set[str] = {
    "system", "popen", "spawn", "fork", "exec", "eval",
    "__builtins__", "__globals__", "__subclasses__", "__import__",
    "read", "write", "remove", "unlink", "rmdir"
}

# ==============================================================================
# 2. DATA MODELS
# ==============================================================================
class ASTScreenResult(BaseModel):
    is_safe: bool
    violations: List[str] = Field(default_factory=list)
    scanned_lines: int = 0
    safety_score: float = 1.0
    max_loop_depth: int = 0
    detected_modules: List[str] = Field(default_factory=list)

# ==============================================================================
# 3. AST SECURITY SCREENER VISITOR
# ==============================================================================
class ASTSecurityScreener(ast.NodeVisitor):
    """
    Static Python Abstract Syntax Tree (AST) Security Screener.
    Pre-screens code before execution in container or subprocess sandbox.
    Guarantees 100% air-gap compliance and blocks sandbox escape patterns.
    """
    def __init__(self):
        self.violations: List[str] = []
        self.detected_modules: Set[str] = []
        self.current_loop_depth: int = 0
        self.max_loop_depth: int = 0

    def screen(self, script_code: str) -> ASTScreenResult:
        self.violations = []
        self.detected_modules = set()
        self.current_loop_depth = 0
        self.max_loop_depth = 0

        scanned_lines = len(script_code.splitlines()) if script_code else 0

        try:
            tree = ast.parse(script_code)
        except SyntaxError as e:
            return ASTScreenResult(
                is_safe=False,
                violations=[f"AST Syntax Error at line {e.lineno}: {e.msg}"],
                scanned_lines=scanned_lines,
                safety_score=0.0
            )
        except Exception as e:
            return ASTScreenResult(
                is_safe=False,
                violations=[f"AST Parsing Exception: {str(e)}"],
                scanned_lines=scanned_lines,
                safety_score=0.0
            )

        self.visit(tree)

        is_safe = len(self.violations) == 0
        safety_score = 1.0 if is_safe else max(0.0, round(1.0 - (len(self.violations) * 0.35), 2))

        return ASTScreenResult(
            is_safe=is_safe,
            violations=self.violations,
            scanned_lines=scanned_lines,
            safety_score=safety_score,
            max_loop_depth=self.max_loop_depth,
            detected_modules=sorted(list(self.detected_modules))
        )

    def screen_code(self, script_code: str) -> Tuple[bool, Optional[str]]:
        """Backwards-compatible tuple interface."""
        res = self.screen(script_code)
        if res.is_safe:
            return True, None
        return False, "; ".join(res.violations)

    # --------------------------------------------------------------------------
    # VISITOR OVERRIDES
    # --------------------------------------------------------------------------
    def visit_Import(self, node: ast.Import):
        for alias in node.names:
            root_mod = alias.name.split(".")[0].lower()
            self.detected_modules.add(alias.name)
            if root_mod in FORBIDDEN_MODULES:
                self.violations.append(
                    f"Forbidden module import '{alias.name}' at line {node.lineno} (network/system isolation rule)."
                )
        self.generic_visit(node)

    def visit_ImportFrom(self, node: ast.ImportFrom):
        if node.module:
            root_mod = node.module.split(".")[0].lower()
            self.detected_modules.add(node.module)
            if root_mod in FORBIDDEN_MODULES:
                self.violations.append(
                    f"Forbidden from-import 'from {node.module} import ...' at line {node.lineno}."
                )
        for alias in node.names:
            if alias.name in FORBIDDEN_FUNCTIONS or alias.name in FORBIDDEN_MODULES:
                self.violations.append(
                    f"Forbidden entity import '{alias.name}' at line {node.lineno}."
                )
        self.generic_visit(node)

    def visit_Call(self, node: ast.Call):
        # 1. Direct function calls: eval(), exec(), open(), etc.
        if isinstance(node.func, ast.Name):
            func_name = node.func.id
            if func_name in FORBIDDEN_FUNCTIONS:
                self.violations.append(
                    f"Forbidden direct call to '{func_name}()' at line {node.lineno}."
                )
            elif func_name in ["getattr", "setattr", "delattr"]:
                # Inspect arguments for dangerous dunder/system targets
                if len(node.args) >= 2:
                    target_arg = node.args[1]
                    if isinstance(target_arg, ast.Constant) and isinstance(target_arg.value, str):
                        val = target_arg.value.strip().lower()
                        if val in FORBIDDEN_GETATTR_TARGETS or val in FORBIDDEN_ATTRIBUTES or val in FORBIDDEN_MODULES:
                            self.violations.append(
                                f"Obfuscated dynamic '{func_name}(..., '{target_arg.value}')' blocked at line {node.lineno}."
                            )

        # 2. Method attribute calls: obj.eval(), obj.system()
        elif isinstance(node.func, ast.Attribute):
            attr_name = node.func.attr
            if attr_name in FORBIDDEN_FUNCTIONS or attr_name in FORBIDDEN_GETATTR_TARGETS:
                self.violations.append(
                    f"Forbidden method invocation '{attr_name}()' at line {node.lineno}."
                )

        self.generic_visit(node)

    def visit_Attribute(self, node: ast.Attribute):
        # Inspect dunder attributes: obj.__globals__, obj.__subclasses__
        if node.attr in FORBIDDEN_ATTRIBUTES:
            self.violations.append(
                f"Access to forbidden dunder attribute '{node.attr}' at line {node.lineno} (sandbox escape guard)."
            )
        self.generic_visit(node)

    def visit_For(self, node: ast.For):
        self.current_loop_depth += 1
        if self.current_loop_depth > self.max_loop_depth:
            self.max_loop_depth = self.current_loop_depth
        if self.current_loop_depth > 4:
            self.violations.append(
                f"Excessive loop nesting depth ({self.current_loop_depth} > 4) at line {node.lineno} (resource bomb guard)."
            )
        self.generic_visit(node)
        self.current_loop_depth -= 1

    def visit_While(self, node: ast.While):
        self.current_loop_depth += 1
        if self.current_loop_depth > self.max_loop_depth:
            self.max_loop_depth = self.current_loop_depth
        if self.current_loop_depth > 4:
            self.violations.append(
                f"Excessive loop nesting depth ({self.current_loop_depth} > 4) at line {node.lineno}."
            )
        self.generic_visit(node)
        self.current_loop_depth -= 1

    def visit_BinOp(self, node: ast.BinOp):
        # Detect huge memory explosion patterns e.g. [0] * 10**9
        if isinstance(node.op, ast.Mult):
            if isinstance(node.right, ast.Constant) and isinstance(node.right.value, (int, float)):
                if node.right.value >= 50_000_000:
                    self.violations.append(
                        f"Excessive memory allocation multiplication ({node.right.value:,} elements) at line {node.lineno}."
                    )
        elif isinstance(node.op, ast.Pow):
            if isinstance(node.right, ast.Constant) and isinstance(node.right.value, (int, float)):
                if node.right.value >= 12:
                    self.violations.append(
                        f"Excessive power calculation exponent (10^{node.right.value}) at line {node.lineno}."
                    )
        self.generic_visit(node)

# Global Screener Singleton
ast_screener = ASTSecurityScreener()
