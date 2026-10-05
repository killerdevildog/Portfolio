# GitHub portfolio PDF

`portfolio.html` is the portfolio page linked from the main navigation. Its Download
Portfolio PDF button uses `portfolio-pdf.js` and the résumé’s vendored html2pdf library
to generate a fresh PDF from the displayed HTML. `case-studies.json` contains the
reviewed case narratives and citations.

Export processes one A4 page at a time to bound canvas memory, shows progress, and
keeps paper white on mobile and dark-mode displays. Contents destinations and source
links are added to the PDF. Like the résumé export, page content is rasterized.
`Quaylyn_Rimer_Portfolio.pdf` remains a prepared edition for the no-JavaScript fallback;
the normal download does not fetch that file.

This portfolio covers all public merged PRs and issues marked completed authored by
`killerdevildog` at the recorded research date. Its scope is intentionally broader
than the homepage's accepted-code-only showcase: documentation PRs, a personal fork
merge, and completed discussions are labeled according to their actual outcome.

## Research and rebuild

1. Run `python3 scripts/research_portfolio.py --refresh` from the project root to
   collect evidence through `gh`. The ignored `.portfolio-research/` cache keeps
   issue/PR bodies, discussions, reviews, patches, commits, and timelines. Fetch
   linked issues and closing commits when needed to explain a record accurately.
2. Review new evidence and edit `case-studies.json`. The collector does **not**
   automatically manufacture design rationale or mark research complete. Cite
   consequential claims and distinguish reported tests, inference, and verified
   merge/closure evidence. Keep source coverage aligned with the complete inventory.
3. Run `python3 scripts/build_portfolio.py` to update the live HTML. Serve the project
   and run `node tests/portfolio-pdf.cjs` to verify the browser-generated download.
4. To update the optional prepared edition, run `node scripts/render_portfolio_pdf.cjs` with Playwright available in
   `NODE_PATH`. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` optionally selects an installed
   Chromium binary. Rendering fails if a page overflows.
5. Run `python3 scripts/verify_portfolio.py` (requires Poppler's `pdfinfo` and
   `pdftotext`). Inspect representative rendered PDF pages and every layout flagged
   by the automated checks before publishing.

The normal download runs entirely in the visitor’s browser and uses a locally served
library, with no print dialog or external conversion service. The optional prepared
edition uses Chromium’s print renderer and retains selectable text.
