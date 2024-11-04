import os
import re
from typing import Set

def process_files2(directory: str):
    pixel_values = set()
    pattern = r'(-?\d*\.?\d+px)(?!-[Vv])'
    
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

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.css')):
                file_path = os.path.join(root, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    new_content = content
                    sorted_values = sorted(pixel_values, key=len, reverse=True)
                    
                    for value in sorted_values:
                        is_negative = value.startswith('-')
                        base_value = value[1:] if is_negative else value
                        number = base_value[:-2].replace('.', '_')
                        
                        if is_negative:
                            var_name = f"var(---{number}px-V)"
                        else:
                            var_name = f"var(--{number}px-V)"
                        
                        pattern = f'{re.escape(value)}(?!-[Vv])'
                        new_content = re.sub(pattern, var_name, new_content)
                    
                    if new_content != content:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated {file_path}")
                        
                except Exception as e:
                    print(f"Error processing {file_path}: {e}")

    create_variables_file(pixel_values, "pixel-variables.css")
    return pixel_values

def create_variables_file2(pixel_values: Set[str], output_file: str):
    value_pairs = []
    for value in pixel_values:
        is_negative = value.startswith('-')
        numeric_part = float(value[1:-2] if is_negative else value[:-2])
        if is_negative:
            numeric_part = -numeric_part
        value_pairs.append((numeric_part, value))
    
    sorted_pairs = sorted(value_pairs, key=lambda x: x[0])
    
    css_content = ":root {\n"
    for _, original_value in sorted_pairs:
        is_negative = original_value.startswith('-')
        base_value = original_value[1:] if is_negative else original_value
        number = base_value[:-2].replace('.', '_')
        
        if is_negative:
            css_content += f"  ---{number}px-V: {original_value};\n"
        else:
            css_content += f"  --{number}px-V: {original_value};\n"
    
    css_content += "}\n"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            f.write(css_content)
        print(f"\nCSS variables have been created in {output_file}")
    except Exception as e:
        print(f"Error writing to {output_file}: {e}")

def main2():
    src_directory = "./src"
    
    print("Starting pixel value replacement process...")
    pixel_values = process_files(src_directory)
    
    if pixel_values:
        print("\nProcessed the following pixel values:")
        for value in sorted(pixel_values, key=lambda x: float(x[:-2] if x[:-2] else 0)):
            number = value[:-2].replace('.', '_')
            print(f"{value} → var(--{number}px-V)")
    else:
        print("No pixel values found")

def generate_responsive_css(variables, output_file):
    def calculate_value(value, ratio):
        try:
            # Remove 'px' and convert to float
            if 'px' in value:
                num = float(value.replace('px', ''))
                # Calculate new value and round to 1 decimal place
                return f"{round(num * ratio, 1)}px"
        except ValueError:
            return value
        return value

    # Base CSS
    css_content = ":root {\n"
    for var, value in variables:
        css_content += f"  {var}: {value};\n"
    css_content += "}\n\n"
    
    # 1280px media query (ratio: 1280/1920 = 0.6666...)
    css_content += "@media screen and (max-width: 1280px) {\n"
    css_content += "  :root {\n"
    for var, value in variables:
        new_value = calculate_value(value, 1280/1920)
        css_content += f"    {var}: {new_value};\n"
    css_content += "  }\n}\n\n"
    
    # 1355px media query (ratio: 1355/1920 = 0.7057...)
    css_content += "@media screen and (min-width: 1281px) and (max-width: 1355px) {\n"
    css_content += "  :root {\n"
    for var, value in variables:
        new_value = calculate_value(value, 1355/1920)
        css_content += f"    {var}: {new_value};\n"
    css_content += "  }\n}\n\n"
    
    # 4K media query (ratio: 3840/1920 = 2)
    css_content += "@media screen and (min-width: 2560px) {\n"
    css_content += "  :root {\n"
    for var, value in variables:
        new_value = calculate_value(value, 3840/1920)
        css_content += f"    {var}: {new_value};\n"
    css_content += "  }\n}"
    
    # Write to file
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(css_content)

def parse_existing_variables(input_file):
    variables = []
    with open(input_file, 'r', encoding='utf-8') as f:
        for line in f:
            if ':' in line and 'px' in line:
                var, value = line.strip().split(': ')
                value = value.rstrip(';')
                variables.append((var.strip(), value.strip()))
    return variables

def main():
    input_file = "pixel-variables.css"
    output_file = "responsive-pixel-variables.css"
    
    variables = parse_existing_variables(input_file)
    generate_responsive_css(variables, output_file)
    print(f"Generated responsive CSS in {output_file}")

if __name__ == "__main__":
    main()