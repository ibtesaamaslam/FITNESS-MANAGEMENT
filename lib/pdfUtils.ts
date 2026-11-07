import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Downloads a DOM element as a crisp, single-page A4 PDF file.
 */
export const downloadElementAsPdf = async (
  elementId: string,
  filename: string,
  orientation: 'p' | 'l' = 'p'
): Promise<boolean> => {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with id "${elementId}" not found for PDF generation.`);
    return false;
  }

  try {
    // Clone or capture with white background and full visibility
    const canvas = await html2canvas(element, {
      scale: 2, // 2x retina clarity
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pdfWidth = orientation === 'p' ? 210 : 297;
    const pdfHeight = orientation === 'p' ? 297 : 210;
    const margin = 8; // 8mm margin
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = (canvas.height * contentWidth) / canvas.width;

    // Center vertically if height is less than contentHeight, or clamp to page
    const finalHeight = Math.min(contentHeight, pdfHeight - margin * 2);
    const x = margin;
    const y = margin;

    pdf.addImage(imgData, 'PNG', x, y, contentWidth, finalHeight, undefined, 'FAST');
    pdf.save(filename.endsWith('.pdf') ? filename : `${filename}.pdf`);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

/**
 * Triggers printing using a hidden iframe to bypass iframe sandbox restrictions,
 * and falls back to window.print() if needed.
 */
export const printElement = (elementId: string, title: string = 'Document'): void => {
  const element = document.getElementById(elementId);
  if (!element) {
    try {
      window.print();
    } catch (e) {
      console.warn('Native print failed:', e);
    }
    return;
  }

  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.setAttribute('aria-hidden', 'true');
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              @page {
                size: portrait;
                margin: 8mm 10mm;
              }
              *, *::before, *::after {
                box-sizing: border-box;
              }
              body {
                margin: 0;
                padding: 10px;
                font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: #ffffff !important;
                color: #000000 !important;
                font-size: 11px;
                line-height: 1.4;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 6px 0;
                font-size: 10px;
              }
              th, td {
                border: 1px solid #444;
                padding: 5px 7px;
                text-align: left;
              }
              th {
                background: #f1f5f9;
                color: #000;
                font-weight: bold;
              }
              .text-amber-300, .text-amber-400, .text-amber-500 {
                color: #000000 !important;
                font-weight: bold;
              }
              .text-blue-300, .text-blue-400 {
                color: #000000 !important;
              }
              .text-emerald-400, .text-emerald-300 {
                color: #047857 !important;
                font-weight: bold;
              }
              .text-white {
                color: #000000 !important;
              }
              .text-text-primary {
                color: #000000 !important;
              }
              .text-text-secondary {
                color: #4b5563 !important;
              }
              .bg-secondary, .bg-secondary\\/40, .bg-secondary\\/60, .bg-surface {
                background: #f8fafc !important;
                color: #000000 !important;
              }
              .border, .border-gray-700, .border-gray-800 {
                border-color: #cbd5e1 !important;
              }
              .rounded-xl, .rounded-2xl, .rounded-lg {
                border-radius: 6px !important;
              }
              @media print {
                body {
                  padding: 0;
                }
              }
            </style>
          </head>
          <body>
            ${element.innerHTML}
          </body>
        </html>
      `);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (printErr) {
          console.warn('Iframe print error, falling back to window.print():', printErr);
          window.print();
        } finally {
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2500);
        }
      }, 300);
      return;
    }
  } catch (err) {
    console.warn('Iframe setup failed, falling back to window.print():', err);
  }

  try {
    window.print();
  } catch (e) {
    console.error('window.print() completely failed:', e);
  }
};
