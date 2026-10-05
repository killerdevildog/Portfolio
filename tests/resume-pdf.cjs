// Run against a local static server; see tests/README.md.
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');

const baseURL = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:8765';

(async () => {
    const output = await fs.mkdtemp(path.join(os.tmpdir(), 'resume-pdf-test-'));
    const browser = await chromium.launch({
        executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE || undefined
    });
    try {
        const page = await browser.newPage({ acceptDownloads: true });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.route(/^https:\/\//, route => route.abort()); // CDN outage/offline fonts
        await page.addInitScript(() => {
            window.print = () => { throw new Error('Download must not call print'); };
            localStorage.setItem('selectedResumeType', 'military');
        });
        await page.goto(`${baseURL}/resume/resume.html`);
        const ready = () => page.waitForFunction(() => resumeReady && !resumeLoadPromise);
        await ready();
        assert.equal(await page.locator('#resumeTypeSelect').inputValue(), 'military');
        assert.match(await page.locator('#professional-title').innerText(), /Marine/);
        assert.equal(await page.locator('.construction-notice-flow').count(), 1);
        assert.equal(await page.locator('script[src^="resume.js"]').count(), 1);

        async function download(name) {
            const pending = page.waitForEvent('download', { timeout: 30000 });
            await page.locator('#downloadPdfButton').click();
            const file = await pending;
            assert.match(file.suggestedFilename(), /\.pdf$/);
            const destination = path.join(output, `${name}.pdf`);
            await file.saveAs(destination);
            const bytes = await fs.readFile(destination);
            assert.equal(bytes.subarray(0, 5).toString(), '%PDF-');
            assert(bytes.length > 10000);
            const info = execFileSync('pdfinfo', [destination], { encoding: 'utf8' });
            assert.match(info, /Page size:.*A4/);
            await page.waitForFunction(() => !pdfExportInProgress);
            assert.equal(await page.locator('.html2pdf__overlay').count(), 0);
            assert.equal(await page.locator('#resumeTypeSelect').isEnabled(), true);
            return { info, filename: file.suggestedFilename() };
        }

        const types = await page.locator('#resumeTypeSelect option').evaluateAll(options => options.map(o => o.value));
        for (const type of types) {
            await page.selectOption('#resumeTypeSelect', type);
            await ready();
            const text = await page.locator('.resume-container').innerText();
            assert(!/undefined|Loading\.\.\.|Unable to load/.test(text), type);
            assert.equal(await page.locator('#opensource-stats .stat-number').first().innerText(), '25');
            const result = await download(type);
            assert(result.filename.includes(type));
        }
        console.log('PASS: all six résumé types, saved selection, local library, valid A4 downloads, and complete data.');

        await page.setViewportSize({ width: 390, height: 844 });
        await page.emulateMedia({ colorScheme: 'dark' });
        await page.evaluate(() => {
            document.documentElement.style.filter = 'invert(1)';
            document.body.style.colorScheme = 'dark';
        });
        await page.selectOption('#themeSelect', 'minimal');
        await page.evaluate(() => {
            const prototype = window.html2pdf.Worker.prototype;
            const from = prototype.from;
            prototype.from = function (source) {
                window.exportedTheme = source.dataset.theme;
                window.exportedText = source.textContent;
                return from.call(this, source);
            };
        });
        await download('mobile-minimal');
        assert.equal(await page.evaluate(() => exportedTheme), 'minimal');
        assert(!/Download PDF|Back to Portfolio|under construction/.test(await page.evaluate(() => exportedText)));

        // Check actual PDF pixels, not just CSS: white paper must survive dark-mode export.
        const preview = path.join(output, 'light-paper');
        execFileSync('pdftoppm', ['-scale-to', '300', '-singlefile', path.join(output, 'mobile-minimal.pdf'), preview]);
        const ppm = await fs.readFile(`${preview}.ppm`);
        const header = ppm.toString('ascii', 0, 80).match(/^P6\s+(\d+)\s+(\d+)\s+255\s/);
        assert(header, 'Expected RGB PDF preview');
        const pixels = ppm.subarray(header[0].length);
        let whitePixels = 0;
        for (let i = 0; i < pixels.length; i += 3) {
            if (pixels[i] > 230 && pixels[i + 1] > 230 && pixels[i + 2] > 230) whitePixels++;
        }
        assert(whitePixels / (pixels.length / 3) > 0.7, 'PDF paper must remain white in dark mode');
        await page.evaluate(() => { document.documentElement.style.filter = ''; });
        console.log('PASS: exported PDF pixels remain white under dark mode and an inverted page filter.');

        // Force multiple pages and verify the final section reaches the PDF renderer.
        await page.evaluate(() => {
            const container = document.querySelector('.resume-container');
            const original = container.querySelector('.projects-section');
            for (let i = 0; i < 12; i++) container.appendChild(original.cloneNode(true));
            container.lastElementChild.append('FINAL SECTION SENTINEL');
        });
        const long = await download('multi-page');
        assert(Number(long.info.match(/Pages:\s+(\d+)/)[1]) >= 2);
        assert((await page.evaluate(() => exportedText)).includes('FINAL SECTION SENTINEL'));
        console.log('PASS: mobile export, selected theme, excluded controls, and multi-page content.');

        // A data failure must prevent exporting incomplete fallback content, then recover.
        await page.route('**/education.json', route => route.fulfill({ status: 503, body: 'unavailable' }));
        await page.reload();
        await page.waitForFunction(() => document.getElementById('downloadPdfLabel').textContent === 'Retry PDF download');
        let downloads = 0;
        page.on('download', () => downloads++);
        await page.locator('#downloadPdfButton').click();
        await page.waitForFunction(() => !pdfExportInProgress && !resumeLoadPromise);
        assert.equal(downloads, 0);
        await page.unroute('**/education.json');
        await download('recovered-data');

        // Missing PDF dependency is retryable without refreshing the page.
        await page.reload();
        await ready();
        await page.route('**/vendor/html2pdf.bundle.min.js*', route => route.fulfill({ status: 503, body: '' }));
        await page.locator('#downloadPdfButton').click();
        await page.waitForFunction(() => document.getElementById('pdfStatus').textContent.includes('could not be created'));
        assert.equal(await page.locator('#downloadPdfButton').isEnabled(), true);
        await page.unroute('**/vendor/html2pdf.bundle.min.js*');
        await download('recovered-library');
        assert.deepEqual(errors, []);
        console.log('PASS: data failure prevention and retry, library failure and retry, no print dialog or uncaught errors.');
        console.log(`PDF artifacts: ${output}`);
    } finally {
        await browser.close();
    }
})().catch(error => { console.error(error); process.exitCode = 1; });
