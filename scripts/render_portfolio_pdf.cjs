// Requires Playwright (build-time only); the published PDF has no runtime dependency.
const { chromium } = require('playwright');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const fs = require('node:fs/promises');

(async () => {
    const root = path.resolve(__dirname, '..');
    const browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined
    });
    try {
        const page = await browser.newPage({ viewport: { width: 1100, height: 1200 } });
        await page.goto(pathToFileURL(path.join(root, 'portfolio', 'portfolio.html')).href);
        await page.emulateMedia({ media: 'print', colorScheme: 'light' });
        await page.evaluate(() => document.fonts.ready);
        const layout = await page.locator('.sheet').evaluateAll(sheets => sheets.map(sheet => ({
            id: sheet.id, overflow: sheet.scrollHeight - sheet.clientHeight,
            footerBottom: sheet.querySelector('footer').getBoundingClientRect().bottom,
            bottom: sheet.getBoundingClientRect().bottom,
        })));
        const failures = layout.filter(s => s.overflow > 2 || s.footerBottom > s.bottom - 12);
        if (failures.length) throw new Error(`Pages overflow: ${JSON.stringify(failures)}`);
        const output = path.join(root, 'portfolio', 'Quaylyn_Rimer_Portfolio.pdf');
        await page.pdf({ path: output, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true });
        const buffer = await fs.readFile(output);
        if (buffer.subarray(0, 5).toString() !== '%PDF-') throw new Error('Invalid PDF signature');
        console.log(`Rendered ${layout.length} pages: ${output} (${buffer.length} bytes)`);
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
