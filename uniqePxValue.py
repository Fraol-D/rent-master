import os
import re
from typing import Set

def find_pixel_values(directory: str) -> Set[str]:
    pixel_values = set()
    pattern = r'[-]?\d*\.?\d+px'
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.css')):
                file_path = os.path.join(root, file)
                
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    matches = re.findall(pattern, content)
                    pixel_values.update(matches)
                        
                except Exception as e:
                    print(f"Error reading {file_path}: {e}")
    
    return pixel_values

def create_css_variables(pixel_values: Set[str], output_file: str):
    sorted_values = sorted(pixel_values, key=lambda x: float(x[:-2]))
    
    css_content = ":root {\n"
    
    for value in sorted_values:
        # Remove 'px' and replace decimal point with underscore
        number = value[:-2].replace('.', '_')
        css_content += f"  --{number}px-V: {value};\n"
    
    css_content += "}\n"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print(f"\nCSS variables have been created in {output_file}")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")

def main():
    src_directory = "./src"
    output_file = "pixel-variables.css"
    
    pixel_values = find_pixel_values(src_directory)
    
    if pixel_values:
        print("\nUnique pixel values found:")
        for value in sorted(pixel_values, key=lambda x: float(x[:-2])):
            print(value)
            
        create_css_variables(pixel_values, output_file)
    else:
        print("No pixel values found")

if __name__ == "__main__":
    main()