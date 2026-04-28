import subprocess
import re

html_path = './index.html'

# Obtiene hash corto y fecha del último commit
def get_version_info():
    hash_ = subprocess.check_output(['git', 'rev-parse', '--short', 'HEAD']).decode().strip()
    date = subprocess.check_output(['git', 'log', '-1', '--format=%cd', '--date=short']).decode().strip()
    return hash_, date

def update_html_version(version_string):
    with open(html_path, 'r', encoding='utf-8') as f:
        html = f.read()
    html = re.sub(r'<footer class="app-version">.*?<\/footer>', f'<footer class="app-version">{version_string}</footer>', html, flags=re.DOTALL)
    with open(html_path, 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == '__main__':
    hash_, date = get_version_info()
    version_string = f'Versión: {hash_} - {date}'
    update_html_version(version_string)
    print('Versión actualizada:', version_string)
