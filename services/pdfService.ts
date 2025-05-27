
// jsPDF and html2canvas are expected to be globally available from CDN scripts in index.html
const { jsPDF } = (window as any).jspdf;
declare var html2canvas: any; // Inform TypeScript that html2canvas is global

const PRINT_SESSION_WRAPPER_ID = 'pdf-print-session-wrapper';
const PDF_PRINT_MARGIN = '10mm'; // Margem final desejada no PDF

function getOrCreatePrintSessionWrapper(): HTMLElement {
  let wrapper = document.getElementById(PRINT_SESSION_WRAPPER_ID);
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.id = PRINT_SESSION_WRAPPER_ID;
    // Estilos para esconder o wrapper da visualização e interação
    wrapper.style.position = 'absolute';
    wrapper.style.left = '-99999px';
    wrapper.style.top = '-99999px';
    wrapper.style.width = '0'; // Não ocupa espaço visual
    wrapper.style.height = '0'; // Não ocupa espaço visual
    wrapper.style.overflow = 'hidden'; // Garante que nada vaze
    wrapper.style.zIndex = '-100'; // Bem atrás de tudo
    document.body.appendChild(wrapper);
  }
  wrapper.innerHTML = ''; // Limpa conteúdo de sessões anteriores
  return wrapper;
}


export const createPdfFromHtmlElements = async (
  pageElementIds: string[],
  fileName: string = "atividade_gerada.pdf"
): Promise<void> => {
  if (!pageElementIds || pageElementIds.length === 0) {
    throw new Error("Nenhum elemento de página fornecido para criar o PDF.");
  }

  if (typeof jsPDF === 'undefined') {
    throw new Error("jsPDF library is not loaded.");
  }
  if (typeof html2canvas === 'undefined') {
    console.warn("html2canvas library might not be loaded. PDF generation cannot proceed.");
    throw new Error("html2canvas library is not loaded.");
  }

  const pdf = new jsPDF({
    orientation: 'p', // portrait
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    floatPrecision: 16 
  });

  const printSessionWrapper = getOrCreatePrintSessionWrapper();

  const pdfPageWidth = pdf.internal.pageSize.getWidth();
  const pdfPageHeight = pdf.internal.pageSize.getHeight();

  for (let i = 0; i < pageElementIds.length; i++) {
    const elementId = pageElementIds[i];
    const originalElement = document.getElementById(elementId);

    if (!originalElement) {
      console.error(`Elemento com ID '${elementId}' não encontrado para a página ${i + 1} do PDF.`);
      throw new Error(`Elemento da página ${i + 1} não encontrado para inclusão no PDF.`);
    }

    if (i > 0) {
      pdf.addPage();
    }
    
    // Cria um container A4 específico para esta página a ser impressa
    const a4Container = document.createElement('div');
    a4Container.style.width = '210mm';
    a4Container.style.height = '297mm';
    a4Container.style.minHeight = '297mm'; // Garante altura mesmo se conteúdo for menor
    a4Container.style.backgroundColor = 'white'; // Fundo branco para o PDF
    a4Container.style.overflow = 'hidden';   // CRÍTICO: Corta qualquer conteúdo que exceda as dimensões A4
    a4Container.style.margin = '0';
    a4Container.style.padding = '0';         // O container A4 em si não tem padding
    a4Container.style.boxSizing = 'border-box';
    a4Container.style.display = 'flex';      // Permite que o clone se expanda corretamente
    a4Container.style.flexDirection = 'column';


    // Clona o conteúdo da página original
    const clonedElement = originalElement.cloneNode(true) as HTMLElement;
    
    // Estiliza o clone para impressão dentro do container A4
    clonedElement.style.width = '100%';
    clonedElement.style.height = '100%'; // Ocupa toda a altura do a4Container
    clonedElement.style.minHeight = 'initial'; // Remove min-height do original se houver
    clonedElement.style.padding = PDF_PRINT_MARGIN; // ESTA SERÁ A MARGEM VISÍVEL NO PDF
    clonedElement.style.margin = '0';           // Remove margens externas do clone
    clonedElement.style.boxShadow = 'none';     // Remove sombras
    clonedElement.style.border = 'none';        // Remove bordas
    clonedElement.style.boxSizing = 'border-box';
    clonedElement.style.pageBreakAfter = 'avoid'; // Evita quebras dentro do clone
    // Manter o font-size do original ou definir um específico para impressão, e.g., clonedElement.style.fontSize = '11pt';

    a4Container.appendChild(clonedElement);
    printSessionWrapper.appendChild(a4Container); // Adiciona ao DOM invisível

    // Garante que o DOM atualize antes do html2canvas (especialmente para estilos complexos)
    await new Promise(resolve => requestAnimationFrame(resolve));


    try {
      const canvas = await html2canvas(a4Container, { // Captura o a4Container
        scale: window.devicePixelRatio > 1.5 ? window.devicePixelRatio : 2, // Escala para melhor qualidade
        useCORS: true,
        logging: false,
        // html2canvas usará o offsetWidth/Height do a4Container, que o browser converte de mm para px
        width: a4Container.offsetWidth, 
        height: a4Container.offsetHeight,
        windowWidth: a4Container.scrollWidth, // Para garantir que todo conteúdo seja considerado
        windowHeight: a4Container.scrollHeight,
      });
      
      const imgData = canvas.toDataURL('image/png');
      
      // A imagem agora deve ter as proporções corretas do A4
      // Adiciona a imagem ao PDF, ocupando a página inteira (margem 0 para jsPDF)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfPageWidth, pdfPageHeight);

    } catch (error) {
      console.error(`Erro ao adicionar HTML da página ${i + 1} (ID: ${elementId}) ao PDF:`, error);
      throw new Error(`Falha ao processar conteúdo da página ${i + 1} para o PDF: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
       // Remove o a4Container da página atual do wrapper para liberar memória/DOM
       if (printSessionWrapper.contains(a4Container)) {
           printSessionWrapper.removeChild(a4Container);
       }
    }
  }
  
  // Limpa o wrapper de sessão de impressão ao final (opcional, se for recriado a cada chamada)
  // Se getOrCreatePrintSessionWrapper sempre limpa o innerHTML, isso pode não ser estritamente necessário aqui.
  // Mas para garantir:
  printSessionWrapper.innerHTML = ''; 

  pdf.save(fileName);
};
