# Refresh accepted contributions

Authenticate with `gh auth login`, then run:

```sh
python3 scripts/update_contributions.py
```

The updater replaces `pull_requests.json` and `projects.json` using public GitHub
data for `killerdevildog`, and refreshes the language split in `gh_contribution.json`
(each published PR counts once, divided across languages by changed lines). It verifies each PR's merge status and excludes personal
repositories, forks, and documentation-only contributions. No credentials are
written into the portfolio.

Code selection uses implementation, build, and test file extensions, build
filenames, and GitHub workflow paths. PRs titled as documentation changes are
excluded, including documentation changes within source files. Extend the file
rules when contributing in another language; this is a conservative showcase,
not a count of every kind of GitHub contribution.

The portfolio shows the snapshot's refresh date. All GitHub reads must succeed
before the snapshots are replaced. Review the resulting files before publishing.
