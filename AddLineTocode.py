import os
import re
from typing import Set

def add_input_import(file_path: str):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check if file contains <Input but not already importing Input
        if '<Input' in content and 'import { Input }' not in content:
            print(f"Found <Input in {file_path}")  # Debug print
            
            # Calculate relative path to CustomReactComponents
            base_path = os.path.dirname(file_path)
            target_path = 'src/renderer/Project/TSX/Helpers/CustomReactComponents'
            
            # Convert both paths to absolute paths for comparison
            abs_base = os.path.abspath(base_path)
            abs_target = os.path.abspath(target_path)
            
            # Calculate relative path
            rel_path = os.path.relpath(abs_target, abs_base)
            # Ensure proper path separators
            rel_path = rel_path.replace('\\', '/')
            
            # Add import statement at the beginning of the file
            import_statement = f"import {{ Input }} from '{rel_path}';\n"
            
            print(f"Adding import: {import_statement}")  # Debug print
            
            # Find the position of the first import statement or start of file
            import_match = re.search(r'^(import .+;\n)*', content, re.MULTILINE)
            if import_match:
                pos = import_match.end()
                new_content = content[:pos] + import_statement + content[pos:]
            else:
                new_content = import_statement + content
                
            # Write the modified content back to the file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully added Input import to {file_path}")
            
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def process_files():
    # Get the current working directory
    current_dir = os.getcwd()
    src_dir = os.path.join(current_dir, 'src')
    
    print(f"Scanning directory: {src_dir}")  # Debug print
    
    # Process all TSX files
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx'):
                file_path = os.path.join(root, file)
                print(f"Checking file: {file_path}")  # Debug print
                add_input_import(file_path)

if __name__ == "__main__":
    process_files()