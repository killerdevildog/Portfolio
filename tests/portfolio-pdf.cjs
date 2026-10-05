const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
(async () => {
    const output = await fs.mkdtemp(path.join(os.tmpdir(), 'portfolio-pdf-test-'));
    const browser = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined });
    try {
        const page = await browser.newPage({ acceptDownloads: true });
        const errors = [];
        await page.route(/^https:\/\//, route => route.abort());
        await page.route('**/Quaylyn_Rimer_Portfolio.pdf', route => route.abort());
        await page.addInitScript(() => { window.print = () => { throw new Error('Must not print'); }; });
        const base = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:8765';
        await page.goto(`${base}/index.html`);
        const nav = page.locator('#navmenu a', { hasText: 'Portfolio PDF' });
        assert.match(await nav.evaluate(el => el.closest('li').previousElementSibling.textContent), /Resume PDF/);
        await nav.click();
        assert.match(page.url(), /portfolio\/portfolio.html$/);
        page.on('pageerror', e => errors.push(e.message));
        assert.equal(await page.locator('main > .sheet').count(), 61);
        await page.setViewportSize({ width: 390, height: 844 });
        await page.emulateMedia({ colorScheme: 'dark' });
        // A missing dependency must leave a working retry button, without a download.
        await page.route('**/html2pdf.bundle.min.js*', route => route.fulfill({ status: 503, body: '' }));
        await page.locator('#downloadPdfButton').click();
        await page.waitForFunction(() => document.getElementById('pdfStatus').textContent.includes('could not be created'));
        assert.equal(await page.locator('#downloadPdfButton').isEnabled(), true);
        await page.unroute('**/html2pdf.bundle.min.js*');
        await page.evaluate(() => {
            document.documentElement.style.filter = 'invert(1)';
            document.querySelector('.cover-name').textContent = 'HTML EXPORT CHECK';
            window.renderedPages = [];
            // Instrument assignment before the library loads, including the first page.
            Object.defineProperty(window, 'html2pdf', { configurable: true, set(library) {
                const from = library.Worker.prototype.from;
                library.Worker.prototype.from = function(source) {
                    window.renderedPages.push({id: source.id, text: source.textContent});
                    return from.call(this, source);
                };
                Object.defineProperty(window, 'html2pdf', { value: library, configurable: true, writable: true });
            }});
        });
        const pending = page.waitForEvent('download', { timeout: 180000 });
        await page.locator('#downloadPdfButton').click();
        const download = await pending;
        assert.equal(download.suggestedFilename(), 'Quaylyn_Rimer_Portfolio.pdf');
        const target = path.join(output, 'portfolio.pdf');
        await download.saveAs(target);
        assert.equal(await download.failure(), null);
        const bytes = await fs.readFile(target);
        assert.equal(bytes.subarray(0,5).toString(), '%PDF-');
        assert.equal((bytes.toString('latin1').match(/\/Dest\s*\[/g) || []).length, 57, 'Clickable contents entries');
        const info = execFileSync('pdfinfo', [target], { encoding: 'utf8' });
        assert.match(info, /Pages:\s+61\b/);
        assert.match(info, /Page size:.*A4/);
        const urls = execFileSync('pdfinfo', ['-url', target], { encoding: 'utf8' });
        const cases = JSON.parse(await fs.readFile(path.join(__dirname, '../portfolio/case-studies.json'), 'utf8')).cases;
        for (const item of cases) for (const source of item.sources) assert(urls.includes(source.url), source.url);
        const rendered = await page.evaluate(() => renderedPages);
        assert.equal(rendered.length, 61);
        assert(rendered[0].text.includes('HTML EXPORT CHECK'));
        assert.equal(rendered.at(-1).id, 'coder--code-server--issue-5483');
        assert.equal(await page.locator('.html2pdf__overlay').count(), 0);
        assert.equal(await page.locator('#downloadPdfButton').isEnabled(), true);
        assert.match(await page.locator('#pdfStatus').innerText(), /61 pages/);
        for (const number of [1, 14, 61]) {
            const prefix = path.join(output, `page-${number}`);
            execFileSync('pdftoppm', ['-f', String(number), '-l', String(number), '-scale-to', '600', '-singlefile', target, prefix]);
            const ppm = await fs.readFile(`${prefix}.ppm`);
            const header = ppm.toString('ascii', 0, 80).match(/^P6\s+(\d+)\s+(\d+)\s+255\s/);
            assert(header);
            const pixels = ppm.subarray(header[0].length);
            let white = 0, ink = 0;
            for (let i=0;i<pixels.length;i+=3) {
                if (pixels[i]>230 && pixels[i+1]>230 && pixels[i+2]>230) white++;
                if (pixels[i]<180 && pixels[i+1]<180 && pixels[i+2]<180) ink++;
            }
            assert(white/(pixels.length/3)>.7, `White page ${number}`);
            assert(ink/(pixels.length/3)>.01, `Nonblank page ${number}`);
        }
        assert.deepEqual(errors, []);
        console.log('PASS: HTML navigation, library retry, 61-page mobile download from live HTML, source links, white nonblank pages, no print or static PDF dependency.');
        console.log(`Artifacts: ${output}`);
    } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
