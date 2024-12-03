import os
import re

def get_relative_path(from_file, to_file):
    from_parts = os.path.normpath(from_file).split(os.sep)
    to_parts = os.path.normpath(to_file).split(os.sep)
    
    # Remove common prefix
    while from_parts and to_parts and from_parts[0] == to_parts[0]:
        from_parts.pop(0)
        to_parts.pop(0)
    
    # Add '../' for each remaining level in from_parts (except the filename)
    relative_path = ['..'] * (len(from_parts) - 1)
    
    # Add the remaining to_parts
    relative_path.extend(to_parts)
    
    # Join with forward slashes (for import statements)
    return '/'.join(relative_path).replace('.js', '')

def fix_imports(content):
    # Fix malformed imports
    content = re.sub(r'import\s+(\w+)\s+from\s*{\s*([^}]+)\s*};', r'import { \2 } from', content)
    content = re.sub(r'from;[\s\n]+([^;]+);', r'from "\1";', content)
    return content

def process_file(file_path, storage_manager_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Check if file uses storageManager
        if 'storageManager.get' in content or 'storageManager.set' in content:
            # Check if import already exists
            import_pattern = r'import.*storageManager.*from'
            if not re.search(import_pattern, content):
                # Calculate relative path
                relative_path = get_relative_path(file_path, storage_manager_path)
                
                # Create import statement
                import_statement = f"import {{ storageManager }} from '{relative_path}';\n"
                
                # Add import statement after existing imports or at the start
                import_section_end = 0
                import_lines = re.finditer(r'^import.*?;?\n', content, re.MULTILINE)
                for match in import_lines:
                    import_section_end = max(import_section_end, match.end())
                
                if import_section_end > 0:
                    new_content = (
                        content[:import_section_end] +
                        import_statement +
                        content[import_section_end:]
                    )
                else:
                    new_content = import_statement + content
                
                # Fix any malformed imports
                new_content = fix_imports(new_content)
                
                # Write the modified content back to the file
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(new_content)
                print(f"Added import to: {file_path}")
    except Exception as e:
        print(f"Error processing {file_path}: {e}")

def main():
    # Get the absolute path to the src directory
    src_dir = os.path.abspath('src')
    storage_manager_path = os.path.join(src_dir, 'renderer', 'storeManager.js')
    
    # Walk through all files in src directory
    for root, _, files in os.walk(src_dir):
        for file in files:
            if file.endswith(('.ts', '.tsx', '.js', '.jsx')):
                # Skip the storeManager file itself
                if file == 'storeManager.js':
                    continue
                    
                file_path = os.path.join(root, file)
                process_file(file_path, storage_manager_path)

if __name__ == "__main__":
    main()