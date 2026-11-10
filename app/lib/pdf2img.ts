export interface PdfConversionResult {
  imageUrl: string;
  file: File | null;
  error?: string;
}

let pdfjsLib: any = null;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
  if (pdfjsLib) return pdfjsLib;
  if (loadPromise) return loadPromise;

  // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
  loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
    lib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    pdfjsLib = lib;
    return lib;
  });

  return loadPromise;
}

export async function convertPdfToImage(file: File): Promise<PdfConversionResult> {
  try {
    const lib = await loadPdfJs();
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
    const totalPages = Math.min(pdf.numPages, 4);

    const pageCanvases: HTMLCanvasElement[] = [];
    let totalHeight = 0;
    let maxWidth = 0;

    for (let i = 1; i <= totalPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const pageCanvas = document.createElement("canvas");
      const pageContext = pageCanvas.getContext("2d");
      pageCanvas.width = viewport.width;
      pageCanvas.height = viewport.height;
      if (pageContext) {
        pageContext.imageSmoothingEnabled = true;
        pageContext.imageSmoothingQuality = "high";
      }
      await page.render({ canvasContext: pageContext!, viewport }).promise;
      pageCanvases.push(pageCanvas);
      totalHeight += viewport.height;
      if (viewport.width > maxWidth) maxWidth = viewport.width;
    }

    const masterCanvas = document.createElement("canvas");
    masterCanvas.width = maxWidth;
    masterCanvas.height = totalHeight;
    const masterCtx = masterCanvas.getContext("2d");

    if (masterCtx) {
      let currentY = 0;
      for (const c of pageCanvases) {
        masterCtx.drawImage(c, 0, currentY);
        currentY += c.height;
      }
    }

    return new Promise((resolve) => {
      masterCanvas.toBlob(
        (blob) => {
          if (blob) {
            const originalName = file.name.replace(/\.pdf$/i, "");
            const imageFile = new File([blob], `${originalName}.png`, {
              type: "image/png",
            });
            resolve({ imageUrl: URL.createObjectURL(blob), file: imageFile });
          } else {
            resolve({ imageUrl: "", file: null, error: "Failed to create image blob" });
          }
        },
        "image/png",
        0.95
      );
    });
  } catch (err) {
    return { imageUrl: "", file: null, error: `Failed to convert PDF: ${err}` };
  }
}

export async function extractTextFromPdf(fileOrBuffer: File | ArrayBuffer): Promise<string> {
  const lib = await loadPdfJs();
  const arrayBuffer =
    fileOrBuffer instanceof ArrayBuffer
      ? fileOrBuffer
      : await fileOrBuffer.arrayBuffer();
  const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
  let fullText = "";
  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pageText = textContent.items.map((item: any) => item.str).join(" ");
    fullText += pageText + "\n";
  }
  return fullText.trim();
}
