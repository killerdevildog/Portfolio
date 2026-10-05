# PDF export dependency

`html2pdf.bundle.min.js` is vendored from the npm package `html2pdf.js@0.14.0`
(`dist/html2pdf.bundle.min.js`). It bundles html2canvas and jsPDF; bundled license
notices are preserved, and the html2pdf MIT license is included alongside it.

The library is served locally and loaded only when Download PDF is selected.
No résumé data is sent to an external PDF conversion service.

Upstream documentation: https://ekoopmans.github.io/html2pdf.js/

The PDF preserves the HTML appearance using rasterized pages, with link overlays.
Its text is not selectable. Browser-native printing remains available separately.
