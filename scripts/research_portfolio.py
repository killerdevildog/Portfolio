#!/usr/bin/env python3
"""Collect public GitHub evidence for the portfolio; never edits published narratives.

Requires authenticated gh. Cached records can be resumed after interruption.
Use --refresh to refetch evidence before authoring a new edition.
"""
import argparse
import concurrent.futures
import datetime
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
CACHE = ROOT / '.portfolio-research'


def api(endpoint, paginate=False, fields=()):
    args = ['gh', 'api', endpoint]
    if paginate:
        args.append('--paginate')
    if fields:
        args.extend(['-X', 'GET'])
        for field in fields:
            args.extend(['-f', field])
    raw = subprocess.check_output(args, text=True)
    decoder = json.JSONDecoder()
    pages = []
    while raw.strip():
        page, end = decoder.raw_decode(raw.lstrip())
        raw = raw.lstrip()[end:]
        pages.append(page)
    return [record for page in pages for record in page] if paginate else pages[0]


def store(path, data):
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(data, indent=2) + '\n')
    temporary.replace(path)


def collect(item, refresh=False):
    repo, number, kind = item['repo'], item['number'], item['kind']
    target = CACHE / (repo.replace('/', '--') + f'--{kind}-{number}.json')
    if target.exists() and not refresh:
        return
    base = f'repos/{repo}'
    data = {
        'item': item,
        'detail': api(f'{base}/{"pulls" if kind == "pr" else "issues"}/{number}'),
        'comments': api(f'{base}/issues/{number}/comments?per_page=100', True),
        'timeline': api(f'{base}/issues/{number}/timeline?per_page=100', True),
    }
    if kind == 'pr':
        for key, endpoint in [('files', 'files'), ('reviews', 'reviews'),
                              ('review_comments', 'comments'), ('commits', 'commits')]:
            data[key] = api(f'{base}/pulls/{number}/{endpoint}?per_page=100', True)
        assert data['detail']['merged_at'] and data['detail']['merged']
    else:
        assert data['detail']['state'] == 'closed'
    store(target, data)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--refresh', action='store_true')
    options = parser.parse_args()
    CACHE.mkdir(exist_ok=True)
    inventory = []
    for kind, query in [('pr', 'is:pr is:merged'), ('issue', 'is:issue is:closed')]:
        page_number = 1
        items = []
        while True:
            result = api('search/issues', fields=[
                f'q=author:killerdevildog is:public {query}',
                'per_page=100', f'page={page_number}',
            ])
            if result['incomplete_results'] or result['total_count'] > 1000:
                raise RuntimeError('Search is incomplete; partition the date range before proceeding.')
            items.extend(result['items'])
            if len(items) >= result['total_count']:
                break
            if not result['items']:
                raise RuntimeError('Search pagination stopped before all results were fetched.')
            page_number += 1
        store(CACHE / f'search-{kind}.json', result | {'items': items})
        for item in items:
            if kind == 'issue' and item.get('state_reason') != 'completed':
                continue
            inventory.append({
                'kind': kind, 'number': item['number'],
                'repo': item['repository_url'].split('/repos/')[1],
                'url': item['html_url'], 'title': item['title'],
            })
    store(CACHE / 'inventory.json', inventory)
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool:
        for item, _ in zip(inventory, pool.map(lambda item: collect(item, options.refresh), inventory)):
            print(item['url'], flush=True)
    store(CACHE / 'snapshot.json', {
        'fetched_at': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'count': len(inventory), 'username': 'killerdevildog',
    })


if __name__ == '__main__':
    main()
