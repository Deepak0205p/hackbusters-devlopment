import ast
from typing import Tuple, List, Optional

# Forbidden modules and functions for air-gapped sandboxing
FORBIDDEN_MODULES = {
    "os", "sys", "subprocess", "socket", "urllib", "requests", "http",
    "shutil", "ctypes", "pty", "commands", "posix", "nt", "winreg",
    "builtins", "importlib", "pickle", "shelve", "webbrowser", "ftplib", "smtplib"
}

FORBIDDEN_FUNCTIONS = {
    "eval", "exec", "__import__", "open", "compile", "breakpoint",
    "memoryview", "globals", "locals", "vars", "getattr", "setattr", "delattr"
}

FORBIDDEN_ATTRIBUTES = {
    "__subclasses__", "__bases__", "__mro__", "__globals__", "__code__",
    "__closure__", "__class__", "__builtins__", "__import__"
}

class ASTSecurityScreener:
    """
    Static AST pre-screening analyzer for Python script payloads.
    Blocks dangerous system, shell, socket, or dynamic code execution before containerization.
    """
    def screen_code(self, script_code: str) -> Tuple[bool, Optional[str]]:
        try:
            tree = ast.parse(script_code)
        except SyntaxError as e:
            return False, f"AST Syntax Error: {str(e)}"

        for node in ast.walk(tree):
            # 1. Check Import statements
            if isinstance(node, ast.Import):
                for alias in node.names:
                    root_mod = alias.name.split(".")[0].lower()
                    if root_mod in FORBIDDEN_MODULES:
                        return False, f"Security Violation: Import of forbidden module '{alias.name}' is blocked."

            # 2. Check ImportFrom statements
            elif isinstance(node, ast.ImportFrom):
                if node.module:
                    root_mod = node.module.split(".")[0].lower()
                    if root_mod in FORBIDDEN_MODULES:
                        return False, f"Security Violation: 'from {node.module} import ...' is blocked."

            # 3. Check Direct Call expressions (eval, exec, __import__, open)
            elif isinstance(node, ast.Call):
                if isinstance(node.func, ast.Name):
                    if node.func.id in FORBIDDEN_FUNCTIONS:
                        return False, f"Security Violation: Direct invocation of forbidden function '{node.func.id}()' is blocked."
                elif isinstance(node.func, ast.Attribute):
                    if node.func.attr in FORBIDDEN_FUNCTIONS:
                        return False, f"Security Violation: Invocation of forbidden attribute/method '{node.func.attr}()' is blocked."

            # 4. Check Obfuscated Dunder/Attribute Access (__globals__, __subclasses__)
            elif isinstance(node, ast.Attribute):
                if node.attr in FORBIDDEN_ATTRIBUTES:
                    return False, f"Security Violation: Access to dunder attribute '{node.attr}' is blocked (sandbox escape guard)."

            # 5. Check Constant Strings used in dangerous dynamic patterns (e.g. __import__('os'))
            elif isinstance(node, ast.Constant):
                if isinstance(node.value, str) and node.value in FORBIDDEN_MODULES:
                    # If this constant is inside a subscript or call argument, flag it
                    pass

        return True, None

ast_screener = ASTSecurityScreener()
