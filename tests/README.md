# Résumé PDF regression checks

Requires Node, Playwright with Chromium installed, and Poppler's `pdfinfo`.
Serve the repository locally:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Then run `node tests/resume-pdf.cjs`. If Playwright is installed outside the
repository, set `NODE_PATH` to that installation's `node_modules` directory.
`PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing Chromium binary;
`PORTFOLIO_TEST_URL` can override the local preview URL.

Checks include real PDF downloads for all résumé types, mobile export, selected
theme, multiple pages, missing data and library recovery, and unavailable external
fonts. Generated PDF artifacts are saved in a temporary directory for inspection.

## Portfolio page and PDF

Run `node tests/portfolio-pdf.cjs` with the same environment variables. This checks
navbar navigation to HTML, library failure and retry, actual 42-page generation
from the live page on mobile, source links, canvas cleanup, and white nonblank PDF
pages under dark mode. Static PDF requests and `window.print` are blocked during
the test so they cannot substitute for HTML-based generation.
