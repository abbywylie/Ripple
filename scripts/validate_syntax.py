#!/usr/bin/env python3
"""
Syntax validation script for Python files.
Run this before committing to catch syntax errors early.
"""
import sys
import py_compile
from pathlib import Path

def validate_file(file_path: Path) -> bool:
    """Validate a single Python file for syntax errors."""
    try:
        py_compile.compile(str(file_path), doraise=True)
        print(f"✅ {file_path} - Syntax OK")
        return True
    except py_compile.PyCompileError as e:
        print(f"❌ {file_path} - Syntax Error:")
        print(f"   {e}")
        return False
    except Exception as e:
        print(f"⚠️  {file_path} - Error: {e}")
        return False

def validate_directory(directory: Path) -> bool:
    """Validate all Python files in a directory."""
    all_valid = True
    python_files = list(directory.rglob("*.py"))
    
    if not python_files:
        print(f"No Python files found in {directory}")
        return True
    
    print(f"Validating {len(python_files)} Python files in {directory}...\n")
    
    for py_file in python_files:
        # Skip __pycache__ and .venv directories
        if "__pycache__" in str(py_file) or ".venv" in str(py_file):
            continue
        
        if not validate_file(py_file):
            all_valid = False
    
    return all_valid

def main():
    """Main entry point."""
    if len(sys.argv) > 1:
        # Validate specific files/directories
        paths = [Path(p) for p in sys.argv[1:]]
    else:
        # Default: validate backend directory
        paths = [Path("backend")]
    
    all_valid = True
    for path in paths:
        if not path.exists():
            print(f"❌ Path does not exist: {path}")
            all_valid = False
            continue
        
        if path.is_file():
            if path.suffix == ".py":
                if not validate_file(path):
                    all_valid = False
            else:
                print(f"⚠️  Skipping non-Python file: {path}")
        elif path.is_dir():
            if not validate_directory(path):
                all_valid = False
        else:
            print(f"⚠️  Unknown path type: {path}")
    
    if all_valid:
        print("\n✅ All files validated successfully!")
        sys.exit(0)
    else:
        print("\n❌ Syntax errors found. Please fix before committing.")
        sys.exit(1)

if __name__ == "__main__":
    main()

