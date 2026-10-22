"""Validate the offline package using Python's standard library only."""
import csv
import hashlib
from html.parser import HTMLParser
import io
import json
import math
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
manifest = json.loads((ROOT / 'resource-manifest.json').read_text(encoding='utf-8'))
assert not manifest['failures'], manifest['failures']
for item in manifest['resources']:
    data = (ROOT / item['path']).read_bytes()
    assert hashlib.sha256(data).hexdigest() == item['sha256'], item['path']
tiles = list((ROOT / 'map/tiles').rglob('*.webp'))
assert len(tiles) == 723
assert len(list((ROOT / 'map/assets/icons').glob('*.svg'))) == 43

def rows(filename):
    return list(csv.DictReader(io.StringIO((ROOT / 'map' / filename).read_text(encoding='utf-8-sig'))))

source, translated = rows('master_data.csv'), rows('master_data.zh.csv')
assert len(source) == len(translated) == 497
assert len({r['uid'] for r in source}) == 497
for original, zh in zip(source, translated):
    for key in ['uid', 'x', 'y', 'attribute', 'importance', 'parent_uid', 'parent_type', 'link_url_en']:
        assert original[key] == zh[key], (original['uid'], key)
    assert math.isfinite(float(original['x'])) and math.isfinite(float(original['y']))

class LocalPage(HTMLParser):
    def __init__(self, path):
        super().__init__()
        self.path = path

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        assert attrs.get('id') not in {'comments', 'respond', 'header-container', 'footer', 'local-status'}, self.path
        urls = []
        if attrs.get('src'):
            urls.append(attrs['src'])
        if tag in {'a', 'link'} and attrs.get('href'):
            urls.append(attrs['href'])
        for url in urls:
            if url.startswith(('data:', 'blob:', '#')):
                continue
            assert not urlsplit(url).scheme and not url.startswith('//'), (self.path, url)
            assert (self.path.parent / unquote(urlsplit(url).path)).exists(), (self.path, url)

pages = [ROOT / 'index.html'] + sorted((ROOT / 'guides').glob('*.html'))
assert len(pages) == 10
for page in pages:
    LocalPage(page).feed(page.read_text(encoding='utf-8'))
for css in ROOT.rglob('*.css'):
    for url in re.findall(r'url\([\"\']?([^\"\')]+)', css.read_text(encoding='utf-8-sig')):
        if url.startswith(('data:', '#')):
            continue
        assert not urlsplit(url).scheme and not url.startswith('//'), (css, url)
        assert (css.parent / unquote(urlsplit(url).path)).exists(), (css, url)
print(f'PASS: {len(manifest["resources"])} source resources, 497 markers, 723 tiles, 43 icons, 9 local guides.')
