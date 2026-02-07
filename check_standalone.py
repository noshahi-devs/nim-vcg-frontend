import os
import re

search_path = r'e:\Noshahi Developers Inc\GitHub Projects\NIM VCG\nim-vcg-frontend\src\app\pages'

for root, dirs, files in os.walk(search_path):
    for file in files:
        if file.endswith('.ts') and not file.endswith('.spec.ts'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
                if '@Component(' in content:
                    if 'imports:' in content and 'standalone: true' not in content:
                        print(f"File missing standalone: true but has imports: {filepath}")
