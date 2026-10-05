#!/usr/bin/env python3
"""Refresh public, merged upstream contributions using an authenticated gh CLI.

Run from any directory: python3 scripts/update_contributions.py
Only verified merged PRs in other owners' non-fork repositories are published.
"""

import concurrent.futures
import datetime
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
USERNAME = "killerdevildog"


LANGUAGES = {
    ".c": "C", ".h": "C", ".cc": "C++", ".cpp": "C++", ".cxx": "C++", ".hpp": "C++",
    ".inl": "C++", ".m": "Objective-C", ".mm": "Objective-C", ".py": "Python",
    ".js": "JavaScript", ".jsx": "JavaScript", ".ts": "TypeScript", ".tsx": "TypeScript",
    ".go": "Go", ".rs": "Rust", ".java": "Java", ".cs": "C#", ".vala": "Vala",
    ".vapi": "Vala", ".php": "PHP", ".pm": "Perl", ".pl": "Perl", ".rb": "Ruby",
    ".sh": "Shell", ".cmake": "CMake", ".mk": "Makefile", ".glsl": "GLSL",
    ".hlsl": "HLSL", ".vert": "GLSL", ".frag": "GLSL",
}
BUILD_FILES = {"CMakeLists.txt": "CMake", "Makefile": "Makefile", "meson.build": "Meson"}


def changed_files(pr):
    endpoint = f"repos/{pr['base']['repo']['full_name']}/pulls/{pr['number']}/files"
    files = []
    page = 1
    while True:
        batch = api(endpoint, "-X", "GET", "-f", "per_page=100", "-f", f"page={page}")
        files.extend(batch)
        if len(batch) < 100:
            return files
        page += 1


def has_code_changes(pr, files):
    """Keep implementation/build/test changes; omit documentation-only PRs."""
    if pr["title"].lower().startswith(("docs:", "docs(", "docs ", "fix docs")):
        return False
    suffixes = set(LANGUAGES) | {".vcxproj"}
    return any(Path(f["filename"]).suffix.lower() in suffixes
               or Path(f["filename"]).name in BUILD_FILES
               or f["filename"].startswith(".github/workflows/")
               for f in files)


def language_shares(file_lists):
    """Language split of the published PRs; each PR counts once, divided by changed lines."""
    weights = {}
    for files in file_lists:
        lines = {}
        for f in files:
            path = Path(f["filename"])
            language = BUILD_FILES.get(path.name) or LANGUAGES.get(path.suffix.lower())
            if language:
                lines[language] = lines.get(language, 0) + f["additions"] + f["deletions"]
        total = sum(lines.values())
        for language, count in lines.items():
            if total:
                weights[language] = weights.get(language, 0) + count / total
    total = sum(weights.values())
    shares = {language: round(100 * weight / total, 1)
              for language, weight in sorted(weights.items(), key=lambda pair: -pair[1])}
    return {language: share for language, share in shares.items() if share >= 0.1}


def api(endpoint, *args):
    return json.loads(subprocess.check_output(
        ["gh", "api", endpoint, *args], text=True
    ))


def main():
    items = []
    page = 1
    while True:
        result = api("search/issues", "-X", "GET", "-f",
                     f"q=is:pr is:merged author:{USERNAME} is:public",
                     "-f", "per_page=100", "-f", f"page={page}")
        if result["incomplete_results"] or result["total_count"] > 1000:
            raise RuntimeError("Incomplete GitHub search; existing data was not changed.")
        items.extend(result["items"])
        if len(items) >= result["total_count"]:
            break
        if not result["items"]:
            raise RuntimeError("Missing search results; existing data was not changed.")
        page += 1

    endpoints = [item["pull_request"]["url"].removeprefix("https://api.github.com/")
                 for item in items]
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        details = list(executor.map(api, endpoints))

    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
        file_lists = list(executor.map(changed_files, details))
    contributions = []
    published_files = []
    repositories = {}
    for pr, files in zip(details, file_lists):
        repo = pr["base"]["repo"]
        if (not has_code_changes(pr, files) or not pr["merged_at"] or not pr["merged"] or repo["private"]
                or repo["fork"] or repo["owner"]["login"].lower() == USERNAME.lower()
                or pr["user"]["login"].lower() != USERNAME.lower()):
            continue
        repositories[repo["full_name"]] = repo
        published_files.append(files)
        contributions.append({
            "title": pr["title"], "number": pr["number"], "state": "merged",
            "url": pr["html_url"], "description": pr["body"] or "",
            "repository": {
                "name": repo["name"], "owner": repo["owner"]["login"],
                "full_name": repo["full_name"], "url": repo["html_url"],
                "logo": {"owner_avatar": repo["owner"]["avatar_url"]},
            },
            "author": USERNAME, "created_at": pr["created_at"],
            "merged_at": pr["merged_at"], "commits_count": pr["commits"],
            "changed_files": pr["changed_files"], "additions": pr["additions"],
            "deletions": pr["deletions"],
        })
    contributions.sort(key=lambda pr: pr["merged_at"], reverse=True)
    projects = []
    for name, repo in sorted(repositories.items(), key=lambda pair: pair[0].lower()):
        prs = [pr for pr in contributions if pr["repository"]["full_name"] == name]
        projects.append({
            "id": name.lower().replace("/", "--"), "name": name,
            "title": f"Contributions to {repo['name']}",
            "description": repo["description"] or f"Open source project: {name}.",
            "technologies": [repo["language"]] if repo["language"] else [],
            "githubUrl": repo["html_url"], "category": "open source",
            "status": "merged", "featured": False,
            "contributions": [{"title": pr["title"], "url": pr["url"],
                               "number": pr["number"], "merged_at": pr["merged_at"]}
                              for pr in prs],
        })
    data = {
        "metadata": {
            "username": USERNAME,
            "generated_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "source": "GitHub API via gh; verified pull request merge status",
            "scope": "Public merged code/build/test pull requests into other owners' non-fork repositories; documentation-only changes excluded",
            "total_pull_requests": len(contributions), "repositories": len(projects),
        },
        "pull_requests": contributions,
    }
    languages = json.loads((ROOT / "gh_contribution.json").read_text())
    languages["languages"] = language_shares(published_files)
    languages["languages_basis"] = "Merged pull requests in pull_requests.json, each counted once and split by changed lines"
    languages["last_updated"] = data["metadata"]["generated_at"][:10]
    # Finish all network requests and validation before replacing any snapshot.
    for filename, content in [("pull_requests.json", data), ("projects.json", projects),
                              ("gh_contribution.json", languages)]:
        temporary = ROOT / (filename + ".tmp")
        temporary.write_text(json.dumps(content, indent=2) + "\n")
        temporary.replace(ROOT / filename)
    print(f"Updated {len(contributions)} merged PRs across {len(projects)} upstream projects.")


if __name__ == "__main__":
    main()
