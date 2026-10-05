#!/usr/bin/env python3
"""Build the portfolio HTML from reviewed case studies. PDF rendering is separate."""
import html
import json
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'portfolio'


def escape(value):
    return html.escape(str(value), quote=True)


def link(url, title):
    if urlparse(url).scheme != 'https':
        raise ValueError(f'Expected an HTTPS source link: {url}')
    return f'<a href="{escape(url)}">{escape(title)}</a>'


def main():
    data = json.loads((OUTPUT / 'case-studies.json').read_text())
    cases = data['cases']
    assert len({case['url'] for case in cases}) == len(cases), 'Duplicate case study'
    assert len(cases) == data['record_count'], 'Incomplete case-study coverage'
    contents_pages = (len(cases) + 19) // 20
    first_case_page = 2 + contents_pages
    total_pages = len(cases) + 1 + contents_pages
    date = data['researched_at'][:10]
    pages = []

    def footer(number):
        return f'<footer><span>Quaylyn Rimer · GitHub Portfolio</span><span>{number:02d} / {total_pages:02d}</span></footer>'

    pages.append(f'''<section class="sheet cover" id="cover">
        <div class="running-head">QUAYLYN RIMER <span>PORTFOLIO / {escape(date)}</span></div>
        <div class="cover-intro"><p class="eyebrow">Open source · Engineering · Problem solving</p>
        <h1>Problems explored.<br>Changes explained.</h1>
        <p class="cover-subtitle">A GitHub contribution portfolio</p>
        <p class="cover-name">Quaylyn Rimer</p>
        <a href="https://github.com/killerdevildog">github.com/killerdevildog</a></div>
        <div class="cover-stats"><div><strong>{len(cases)}</strong><span>Individual case studies</span></div>
        <div><strong>{sum(c['kind']=='pr' for c in cases)}</strong><span>Merged pull requests</span></div>
        <div><strong>{sum(c['kind']=='issue' for c in cases)}</strong><span>Completed issue records</span></div></div>
        <div class="cover-scope"><h2>What this portfolio documents</h2>
        <p>One page for each public merged PR and each issue marked completed authored by
        <strong>killerdevildog</strong>, verified on {escape(date)}. Each page explains the problem,
        why it mattered, the contribution, the approach, and the documented outcome.</p>
        <p>Source discussions, review feedback, code changes, and linked resolutions establish the record.
        Author-reported tests are identified as such; this research did not rerun the upstream projects’ tests.
        Inferred design reasoning is labeled rather than presented as the author’s stated motivation.</p>
        <p>A completed issue can represent a maintainer fix, existing-feature guidance, or a concluded proposal.
        Personal repositories and fork merges are labeled explicitly. These pages do not imply employment,
        project endorsement, or upstream acceptance where the sources do not establish it.</p></div>
        {footer(1)}</section>''')
    for chunk in range(contents_pages):
        entries = []
        for index, case in enumerate(cases[chunk * 20:(chunk + 1) * 20], start=chunk * 20):
            entries.append(f'''<li><a href="#{escape(case['id'])}"><span><strong>{escape(case['title'])}</strong>
                <small>{escape(case['repo'])} · {'PR' if case['kind']=='pr' else 'Issue'} #{case['number']}</small></span>
                <b>{first_case_page + index:02d}</b></a></li>''')
        pages.append(f'''<section class="sheet contents" id="contents-{chunk+1}">
            <div class="running-head">CONTENTS <span>{chunk+1} / {contents_pages}</span></div>
            <h1>The contribution record</h1><p class="deck">Ordered by completion date, most recent first. Select any case to jump to its page.</p>
            <ol class="toc">{''.join(entries)}</ol>{footer(chunk+2)}</section>''')

    for index, case in enumerate(cases):
        sources = {source['id']: source for source in case['sources']}
        paragraphs = []
        for section in case['sections']:
            refs = []
            for source_id in section['sources']:
                source = sources[source_id]
                refs.append(link(source['url'], source.get('short_title', source['title'])))
            paragraphs.append(f'''<section class="case-section"><h2>{escape(section['heading'])}</h2>
                <p>{escape(section['text'])} <span class="citations">{' · '.join(refs)}</span></p></section>''')
        source_rows = ''.join(f'<li>{link(s["url"], s["title"])} <span>— {escape(s.get("publisher", "GitHub"))}, {escape(s.get("date", date))}</span></li>' for s in case['sources'])
        pages.append(f'''<article class="sheet case" id="{escape(case['id'])}" data-case-url="{escape(case['url'])}">
            <div class="running-head">CASE STUDY {index+1:02d} <span>{'MERGED PULL REQUEST' if case['kind']=='pr' else 'COMPLETED ISSUE RECORD'}</span></div>
            <header class="case-header"><p class="eyebrow">{escape(case['repo'])} · #{case['number']}</p>
            <h1>{escape(case['title'])}</h1><p class="role">{escape(case['role'])}</p>
            <div class="case-meta"><span>Opened <b>{escape(case['opened_at'])}</b></span>
            <span>{'Merged' if case['kind']=='pr' else 'Closed'} <b>{escape(case['completed_at'])}</b></span></div>
            <p class="outcome">{escape(case['status_label'])}</p></header>
            <div class="case-body">{''.join(paragraphs)}</div>
            <aside class="sources"><h2>Source record</h2><ul>{source_rows}</ul></aside>
            {footer(first_case_page+index)}</article>''')
    document = f'''<!doctype html><html lang="en"><head><meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light">
        <title>Quaylyn Rimer — GitHub Portfolio</title><link rel="stylesheet" href="portfolio.css"></head>
        <body><nav class="preview-controls" aria-label="Portfolio controls"><a href="../index.html">Back to portfolio</a>
        <button class="download" id="downloadPdfButton" type="button" aria-describedby="pdfStatus">Download Portfolio PDF</button>
        <span id="pdfStatus" role="status" aria-live="polite"></span></nav>
        <noscript>Enable JavaScript to generate a PDF from this page, or <a href="Quaylyn_Rimer_Portfolio.pdf" download>download the prepared edition</a>.</noscript>
        <main>{''.join(pages)}</main><script src="portfolio-pdf.js?v=20260908" defer></script></body></html>'''
    (OUTPUT / 'portfolio.html').write_text(document)
    print(f'Built {len(cases)} case studies; expected PDF pages: {total_pages}')


if __name__ == '__main__':
    main()
