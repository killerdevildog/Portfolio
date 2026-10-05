// Direct, local PDF export of the currently rendered résumé.
let pdfExportInProgress = false;
let pdfLibraryPromise = null;

function prepareLightPdfDocument(clonedDocument) {
    // Export colors belong to the document, not the browser's dark-mode display.
    clonedDocument.querySelectorAll('style.darkreader, link.darkreader').forEach(node => node.remove());
    for (const element of [clonedDocument.documentElement, clonedDocument.body]) {
        element.style.setProperty('color-scheme', 'only light', 'important');
        element.style.setProperty('background-color', '#ffffff', 'important');
        element.style.setProperty('filter', 'none', 'important');
    }
    const style = clonedDocument.createElement('style');
    style.textContent = `
        .pdf-export, .pdf-export * {
            color-scheme: only light !important;
            forced-color-adjust: none !important;
            filter: none !important;
            mix-blend-mode: normal !important;
        }
        .resume-container.pdf-export {
            background: #ffffff !important;
            color: #2c3e50 !important;
        }
    `;
    clonedDocument.head.appendChild(style);
}

function loadPdfLibrary() {
    if (typeof window.html2pdf === 'function') return Promise.resolve();
    if (pdfLibraryPromise) return pdfLibraryPromise;
    pdfLibraryPromise = new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const timer = setTimeout(() => finish(new Error('PDF library timed out')), 15000);
        function finish(error) {
            clearTimeout(timer);
            script.onload = script.onerror = null;
            if (error) {
                script.remove();
                reject(error);
            } else {
                resolve();
            }
        }
        script.src = 'vendor/html2pdf.bundle.min.js?v=0.14.0';
        script.onload = () => finish(typeof window.html2pdf === 'function'
            ? null : new Error('PDF library is unavailable'));
        script.onerror = () => finish(new Error('PDF library could not load'));
        document.head.appendChild(script);
    }).catch(error => {
        pdfLibraryPromise = null;
        throw error;
    });
    return pdfLibraryPromise;
}

async function waitForResumeAssets(element) {
    // Remote fonts are optional: keep a working system-font fallback when offline.
    if (document.fonts) {
        let timer;
        await Promise.race([
            document.fonts.ready,
            new Promise(resolve => { timer = setTimeout(resolve, 5000); })
        ]).finally(() => clearTimeout(timer));
    }
    await Promise.all([...element.querySelectorAll('img')].map(img => new Promise((resolve, reject) => {
        const timer = setTimeout(() => finish(new Error('Résumé image timed out')), 10000);
        function finish(error) {
            clearTimeout(timer);
            img.removeEventListener('load', onLoad);
            img.removeEventListener('error', onError);
            error ? reject(error) : resolve();
        }
        const onLoad = () => finish(img.naturalWidth ? null : new Error('Résumé image is empty'));
        const onError = () => finish(new Error('Résumé image could not load'));
        if (img.complete) onLoad();
        else {
            img.addEventListener('load', onLoad);
            img.addEventListener('error', onError);
        }
    })));
}

async function downloadResume() {
    if (pdfExportInProgress) return;
    pdfExportInProgress = true;
    const button = document.getElementById('downloadPdfButton');
    const label = document.getElementById('downloadPdfLabel');
    const status = document.getElementById('pdfStatus');
    let overlay;
    let downloadLink;
    try {
        // An early click or retry must wait for every section of the selected résumé.
        if (resumeLoadPromise) await resumeLoadPromise;
        if (!resumeReady && !await reloadResume()) return;
        setResumeControls(true);
        button.setAttribute('aria-busy', 'true');
        label.textContent = 'Creating PDF…';
        status.textContent = 'Preparing your résumé download…';
        const source = document.querySelector('.resume-container');
        await Promise.all([loadPdfLibrary(), waitForResumeAssets(source)]);

        // Export only the résumé, at a consistent A4 width even on a phone.
        const copy = source.cloneNode(true);
        copy.classList.add('pdf-export');
        copy.setAttribute('data-theme', document.body.dataset.theme || 'original');
        const type = (window.currentResumeType || 'resume').replace(/[^a-z0-9-]/gi, '-');
        const filename = `Quaylyn_Rimer_${type}_Resume.pdf`;
        const worker = window.html2pdf().set({
            filename,
            margin: [8, 8, 8, 8],
            image: { type: 'png' },
            enableLinks: true,
            pagebreak: { mode: ['css'], avoid: [
                '.resume-header', '.section-title', '.skill-item', '.project-item',
                '.pr-item', '.education-item', '.journey-item', '.reference-item'
            ] },
            html2canvas: {
                scale: 2, backgroundColor: '#ffffff', useCORS: true,
                logging: false, windowWidth: 1024, scrollX: 0, scrollY: 0,
                imageTimeout: 10000,
                onclone: prepareLightPdfDocument
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait', compress: true }
        }).from(copy);
        await worker.toContainer();
        overlay = await worker.get('overlay');
        const container = await worker.get('container');
        // Bound canvas dimensions/memory for longer, multi-page résumés.
        const scale = Math.min(2, 14000 / container.scrollHeight);
        if (scale < 0.75) throw new Error('Résumé is too large to export');
        const canvasOptions = await worker.get('html2canvas');
        await worker.set({ html2canvas: { ...canvasOptions, scale } });
        const blob = await worker.toPdf().outputPdf('blob');
        if (blob.size < 100 || await blob.slice(0, 5).text() !== '%PDF-') {
            throw new Error('PDF generation produced an invalid file');
        }
        const url = URL.createObjectURL(blob);
        // Keep the URL alive long enough for browsers to consume the download.
        setTimeout(() => URL.revokeObjectURL(url), 60000);
        downloadLink = document.createElement('a');
        downloadLink.href = url;
        downloadLink.download = filename;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        status.textContent = 'PDF download started.';
    } catch (error) {
        console.error('Unable to download résumé PDF:', error);
        status.textContent = 'The PDF could not be created. Please try Download PDF again. If it still fails, reload this page.';
    } finally {
        overlay?.remove();
        downloadLink?.remove();
        pdfExportInProgress = false;
        button.removeAttribute('aria-busy');
        setResumeControls(false);
        label.textContent = resumeReady ? 'Download PDF' : 'Retry PDF download';
    }
}
