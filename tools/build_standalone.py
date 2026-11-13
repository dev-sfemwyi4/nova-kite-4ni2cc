#!/usr/bin/env python3
"""Build the standalone Nova Keep arena HTML.

usage: python3 -I tools/build_standalone.py <source r17 html> <output html>

* removes every embedded troop render / troop card picture (base, evo, hero)
  from the inline sprite tables, so troops only come from the r18 3D models
* drops the superseded r17 relief-mesh layer and the stray CDN challenge snippet
* injects src/r18/*.js as one <script id="r18-original-3d-troops"> block
* rebrands the visible title / splash strings
Gameplay scripts are copied byte-for-byte otherwise.
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PARTS = ['engine.js', 'parts.js', 'roster.js', 'hook.js']
BRAND = 'NOVA KEEP'


def troop_keys():
    src = open(os.path.join(ROOT, 'src', 'r18', 'roster.js'), encoding='utf-8').read()
    roster = src[src.index('const ROSTER = {'):src.index('// ---- end roster')]
    keys = set(re.findall(r'^  (\w+): \{', roster, re.M))
    alias = src[src.index('const ALIAS = {'):]
    alias = alias[:alias.index('};')]
    keys |= set(re.findall(r'(\w+):\s*\'', alias))
    return keys


def strip_sprites(line, keys, stats):
    m = re.match(r'^(.*?window\.SPRITES(?:3D|_R3|_R4)\s*=\s*)(\{.*\})(;?\s*(?:</script>)?\s*)$', line, re.S)
    if not m:
        return line
    table = json.loads(m.group(2))
    kept = {}
    for k, v in table.items():
        base = re.sub(r'^(card_evo_|card_hero_|card_|evo_|hero_)', '', k)
        if base in keys:
            stats['removed'] += 1
            stats['bytes'] += len(v)
            continue
        kept[k] = v
    return m.group(1) + json.dumps(kept, separators=(',', ':')) + m.group(3)


def main(src_path, out_path):
    html = open(src_path, encoding='utf-8').read()
    keys = troop_keys()
    stats = {'removed': 0, 'bytes': 0}
    lines = html.split('\n')
    lines = [strip_sprites(ln, keys, stats) if 'window.SPRITES' in ln[:200] else ln for ln in lines]
    html = '\n'.join(lines)

    # drop the r17 relief layer (replaced by real geometry) and the CDN challenge iframe snippet
    html, n17 = re.subn(r'<script id="r17-volumetric-3d-troops">.*?</script>\s*', '', html, flags=re.S)
    html, ncf = re.subn(r'<script>\(function\(\)\{function c\(\)\{var b=a\.contentDocument.*?</script>', '', html, flags=re.S)

    body = '\n'.join(open(os.path.join(ROOT, 'src', 'r18', p), encoding='utf-8').read() for p in PARTS)
    block = ('<script id="r18-original-3d-troops">\n(function () {\n\'use strict\';\n'
             "if (typeof document === 'undefined') return;\n"
             + body + '\n})();\n</script>\n')
    idx = html.rindex('</body>') if '</body>' in html else html.rindex('</html>')
    html = html[:idx] + block + html[idx:]

    # visible branding
    html = html.replace('<title>Clash Royale — Arena Clone (r17 · Volumetric 3D Troops)</title>',
                        '<title>Nova Keep — Arena (r18 · Original 3D Troops)</title>')
    html = html.replace('<div class="title">CLASH ROYALE</div>', '<div class="title">' + BRAND + '</div>')
    html = html.replace("'CLASH ROYALE'", "'" + BRAND + "'")
    html = html.replace("'🏰 THE FULL CLASH ROYALE 🏰'", "'🏰 THE FULL " + BRAND + " 🏰'")

    open(out_path, 'w', encoding='utf-8').write(html)
    print('troop keys', len(keys), '| images removed', stats['removed'],
          '(%.1f MB base64)' % (stats['bytes'] / 1e6), '| r17 removed', n17, '| cdn snippet removed', ncf,
          '| out %.2f MB' % (len(html.encode('utf-8')) / 1e6))


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
