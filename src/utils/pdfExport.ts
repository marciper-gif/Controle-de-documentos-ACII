import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ExportPdfOptions {
  elementId: string;
  fileName?: string;
  documentTitle?: string;
  onProgress?: (status: string) => void;
}

/**
 * Captures an HTML element and generates a high-quality multi-page A4 PDF download.
 */
export async function exportElementToPdf(options: ExportPdfOptions): Promise<void> {
  const { elementId, fileName = 'documento.pdf', documentTitle, onProgress } = options;
  const element = document.getElementById(elementId);

  if (!element) {
    throw new Error(`Elemento com ID "${elementId}" não foi encontrado.`);
  }

  if (onProgress) onProgress('Processando layout do documento...');

  // Store original style states if needed
  const isDarkMode = document.documentElement.classList.contains('dark');

  // Capture canvas with 2x scale for crisp readability
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: isDarkMode ? '#0f172a' : '#ffffff',
    windowWidth: element.scrollWidth,
    ignoreElements: (el) => {
      return el.classList.contains('no-print') || el.classList.contains('no-pdf');
    }
  });

  if (onProgress) onProgress('Renderizando páginas PDF...');

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth(); // 210 mm
  const pdfHeight = pdf.internal.pageSize.getHeight(); // 297 mm

  const imgWidth = pdfWidth;
  const imgHeight = (canvas.height * pdfWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = 0;

  // Page 1
  pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
  heightLeft -= pdfHeight;

  // Subsequent pages for multi-page documents
  while (heightLeft > 0) {
    position = heightLeft - imgHeight;
    pdf.addPage();
    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pdfHeight;
  }

  if (documentTitle) {
    pdf.setProperties({
      title: documentTitle,
      subject: 'Documento Oficial',
      creator: 'Normatiza — Sistema de Controle de Documentos',
      author: 'Normatiza'
    });
  }

  if (onProgress) onProgress('Finalizando arquivo...');

  const finalFileName = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
  pdf.save(finalFileName);
}
