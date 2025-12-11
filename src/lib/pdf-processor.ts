import fs from 'fs';
import path from 'path';
import PDFParser from 'pdf2json';

export interface TextChunk {
  content: string;
  source: string;
  chunkIndex: number;
}

export async function extractTextFromPDF(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const pdfParser = new PDFParser(null, true); // true for rawTextContent

      pdfParser.on('pdfParser_dataError', (errData: Error | { parserError: Error }) => {
        const error = errData instanceof Error ? errData : errData.parserError;
        console.error(`PDF parse error for ${filePath}:`, error);
        resolve(''); // Return empty string on error
      });

      pdfParser.on('pdfParser_dataReady', () => {
        try {
          // Get raw text content from the PDF
          const rawText = pdfParser.getRawTextContent();
          resolve(rawText || '');
        } catch (e) {
          console.error(`Error getting text from ${filePath}:`, e);
          resolve('');
        }
      });

      // Load the PDF file
      pdfParser.loadPDF(filePath);
    } catch (error) {
      console.error(`Failed to parse PDF ${filePath}:`, error);
      resolve('');
    }
  });
}

export function chunkText(
  text: string,
  source: string,
  chunkSize: number = 500,
  overlap: number = 50
): TextChunk[] {
  const chunks: TextChunk[] = [];

  // Split by paragraphs first
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const cleanParagraph = paragraph.replace(/\s+/g, ' ').trim();

    if (currentChunk.length + cleanParagraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push({
        content: currentChunk.trim(),
        source,
        chunkIndex: chunkIndex++,
      });

      // Keep overlap from previous chunk
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + cleanParagraph;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + cleanParagraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk.trim(),
      source,
      chunkIndex: chunkIndex,
    });
  }

  return chunks;
}

export async function processAllPDFs(dataDir: string): Promise<TextChunk[]> {
  const allChunks: TextChunk[] = [];

  if (!fs.existsSync(dataDir)) {
    console.warn(`Data directory not found: ${dataDir}`);
    return allChunks;
  }

  const files = fs.readdirSync(dataDir);
  const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

  console.log(`Found ${pdfFiles.length} PDF files to process`);

  for (const file of pdfFiles) {
    const filePath = path.join(dataDir, file);
    console.log(`Processing: ${file}`);

    try {
      const text = await extractTextFromPDF(filePath);
      const chunks = chunkText(text, file);
      allChunks.push(...chunks);
      console.log(`  - Extracted ${chunks.length} chunks`);
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
    }
  }

  console.log(`Total chunks created: ${allChunks.length}`);
  return allChunks;
}
