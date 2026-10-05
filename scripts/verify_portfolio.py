#!/usr/bin/env python3
"""Verify source coverage, PDF pagination/text, and source hyperlinks with Poppler."""
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
PORTFOLIO = ROOT / 'portfolio'


def main():
    data = json.loads((PORTFOLIO / 'case-studies.json').read_text())
    cases = data['cases']
    inventory_path = ROOT / '.portfolio-research' / 'inventory.json'
    if inventory_path.exists():
        inventory = json.loads(inventory_path.read_text())
        assert {c['url'] for c in cases} == {i['url'] for i in inventory}, 'Inventory coverage mismatch'
    expected_count = len(cases) + 1 + (len(cases) + 19) // 20
    pdf = str(PORTFOLIO / 'Quaylyn_Rimer_Portfolio.pdf')
    info = subprocess.check_output(['pdfinfo', pdf], text=True)
    assert int(re.search(r'Pages:\s+(\d+)', info)[1]) == expected_count, info
    assert re.search(r'Page size:.*A4', info), info
    text = subprocess.check_output(['pdftotext', '-layout', pdf, '-'], text=True)
    pages = text.split('\f')
    if not pages[-1].strip():
        pages.pop()
    assert len(pages) == expected_count
    case_pages = pages[-len(cases):]
    links = subprocess.check_output(['pdfinfo', '-url', pdf], text=True)
    for index, (case, page) in enumerate(zip(cases, case_pages), start=1):
        # Poppler sometimes inserts spaces between letter-spaced heading glyphs.
        compact = re.sub(r'\s+', '', page)
        assert len(re.findall(r'CASESTUDY\d+', compact)) == 1, f'Multiple/missing cases on page {index}'
        assert f'CASESTUDY{index:02d}' in compact, case['url']
        assert case['repo'] in page and f"#{case['number']}" in page, case['url']
        assert 'source record' in page.lower(), f'Missing ending of case: {case["url"]}'
        assert '\ufffd' not in page, f'Missing glyph in {case["url"]}'
        for section in case['sections']:
            assert section['text'].strip() and section['sources'], case['url']
        for source in case['sources']:
            assert source['url'] in links, f'Missing PDF source link: {source["url"]}'
    print(f'PASS: {len(cases)} records, one case per page, {expected_count} A4 pages, selectable text, and all source links.')


if __name__ == '__main__':
    main()
