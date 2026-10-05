// Generate from the displayed HTML with the same vendored library as the résumé.
// Render one A4 sheet at a time: never allocate a canvas spanning the whole book.
(() => {
    let exporting = false;
    let libraryPromise;
    const button = document.getElementById('downloadPdfButton');
    const status = document.getElementById('pdfStatus');

    function loadLibrary() {
        if (typeof window.html2pdf === 'function') return Promise.resolve();
        if (libraryPromise) return libraryPromise;
        libraryPromise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const timer = setTimeout(() => finish(new Error('PDF library timed out')), 15000);
            function finish(error) {
                clearTimeout(timer);
                script.onload = script.onerror = null;
                if (error) { script.remove(); reject(error); } else resolve();
            }
            script.src = '../resume/vendor/html2pdf.bundle.min.js?v=0.14.0';
            script.onload = () => finish(typeof window.html2pdf === 'function' ? null : new Error('PDF library unavailable'));
            script.onerror = () => finish(new Error('PDF library failed to load'));
            document.head.appendChild(script);
        }).catch(error => { libraryPromise = null; throw error; });
        return libraryPromise;
    }

    function lightDocument(doc) {
        doc.querySelectorAll('style.darkreader, link.darkreader').forEach(node => node.remove());
        const style = doc.createElement('style');
        style.textContent = `
            :root { --ink: #172b3e !important; --muted: #526473 !important; --accent: #075d76 !important; --line: #d6e1e7 !important; }
            html, body { background: #fff !important; filter: none !important; color-scheme: only light !important; }
            .pdf-export, .pdf-export * { filter: none !important; color-scheme: only light !important; forced-color-adjust: none !important; mix-blend-mode: normal !important; }
            .sheet.pdf-export { background: #fff !important; color: #172b3e !important; }
        `;
        doc.head.appendChild(style);
    }

    button.addEventListener('click', async () => {
        if (exporting) return;
        exporting = true;
        button.disabled = true;
        button.setAttribute('aria-busy', 'true');
        let overlay, canvas, downloadLink;
        try {
            status.textContent = 'Preparing your portfolio…';
            await loadLibrary();
            if (document.fonts) await document.fonts.ready;
            // Snapshot all pages together so a download always represents one edition.
            const pages = [...document.querySelectorAll('main > .sheet')].map(sheet => sheet.cloneNode(true));
            if (!pages.length) throw new Error('No portfolio pages found');
            const destinations = new Map(pages.map((sheet, i) => [sheet.id, i + 1]));
            let pdf;
            for (const [index, sheet] of pages.entries()) {
                button.textContent = `Creating PDF… ${index + 1}/${pages.length}`;
                status.textContent = `Rendering page ${index + 1} of ${pages.length}…`;
                sheet.classList.add('pdf-export');
                const worker = window.html2pdf().set({
                    margin: 0, enableLinks: false, pagebreak: { mode: [] },
                    image: { type: 'png' },
                    html2canvas: { scale: 1.5, backgroundColor: '#ffffff', logging: false,
                        windowWidth: 1100, windowHeight: 1200, scrollX: 0, scrollY: 0,
                        onclone: lightDocument },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
                }).from(sheet);
                try {
                    await worker.toContainer();
                    overlay = await worker.get('overlay');
                    // Measure annotations while the export DOM is still attached.
                    const container = await worker.get('container');
                    const rendered = container.querySelector('.sheet');
                    const bounds = rendered.getBoundingClientRect();
                    const footer = rendered.querySelector('footer').getBoundingClientRect();
                    if (rendered.scrollHeight > rendered.clientHeight + 2 || footer.bottom > bounds.bottom - 12) {
                        throw new Error(`Page ${index + 1} is too long`);
                    }
                    const links = [];
                    for (const link of rendered.querySelectorAll('a[href]')) {
                        const href = link.getAttribute('href');
                        const target = href.startsWith('#') ? destinations.get(href.slice(1)) : null;
                        if (!target && !/^https:\/\//i.test(href)) continue;
                        for (const rect of link.getClientRects()) links.push({
                            x: (rect.left - bounds.left) * 210 / bounds.width,
                            y: (rect.top - bounds.top) * 297 / bounds.height,
                            width: rect.width * 210 / bounds.width, height: rect.height * 297 / bounds.height,
                            target: target ? { pageNumber: target } : { url: href }
                        });
                    }
                    await worker.toCanvas();
                    canvas = await worker.get('canvas');
                    if (!canvas.width || !canvas.height) throw new Error('Empty PDF page');
                    if (!pdf) {
                        // Obtain the bundled jsPDF instance without loading a second library.
                        await worker.toPdf();
                        pdf = await worker.get('pdf');
                        while (pdf.getNumberOfPages()) pdf.deletePage(pdf.getNumberOfPages());
                        pdf.setProperties({ title: 'Quaylyn Rimer — GitHub Portfolio', author: 'Quaylyn Rimer' });
                    }
                    pdf.addPage('a4', 'portrait');
                    pdf.addImage(canvas, 'PNG', 0, 0, 210, 297, undefined, 'FAST');
                    for (const link of links) pdf.link(link.x, link.y, link.width, link.height, link.target);

                } finally {
                    overlay?.remove(); overlay = null;
                    if (canvas) { canvas.width = 0; canvas.height = 0; canvas = null; }
                }
            }
            const blob = pdf.output('blob');
            if (blob.size < 100 || await blob.slice(0, 5).text() !== '%PDF-') throw new Error('Invalid PDF output');
            const url = URL.createObjectURL(blob);
            setTimeout(() => URL.revokeObjectURL(url), 60000);
            downloadLink = document.createElement('a');
            downloadLink.href = url;
            downloadLink.download = 'Quaylyn_Rimer_Portfolio.pdf';
            document.body.appendChild(downloadLink);
            downloadLink.click();
            status.textContent = `PDF download started — ${pages.length} pages.`;
        } catch (error) {
            console.error('Unable to create portfolio PDF:', error);
            status.textContent = 'The PDF could not be created. Please try Download Portfolio PDF again. If it still fails, reload this page.';
        } finally {
            overlay?.remove();
            downloadLink?.remove();
            exporting = false;
            button.disabled = false;
            button.removeAttribute('aria-busy');
            button.textContent = 'Download Portfolio PDF';
        }
    });
})();
