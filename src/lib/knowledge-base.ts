import { DocumentChunk } from '@/types';
import { generateEmbedding, generateEmbeddings } from './gemini';
import path from 'path';
import fs from 'fs';

// In-memory storage for the knowledge base
let knowledgeBase: DocumentChunk[] = [];
let isInitialized = false;

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Chunk text into smaller pieces
function chunkText(text: string, chunkSize: number = 500, overlap: number = 50): string[] {
  const chunks: string[] = [];

  // Split by paragraphs (double newlines)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

  let currentChunk = '';

  for (const paragraph of paragraphs) {
    const cleanParagraph = paragraph.replace(/\s+/g, ' ').trim();

    if (currentChunk.length + cleanParagraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());

      // Keep overlap from previous chunk
      const words = currentChunk.split(' ');
      currentChunk = words.slice(-Math.floor(overlap / 5)).join(' ') + ' ' + cleanParagraph;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + cleanParagraph;
    }
  }

  // Don't forget the last chunk
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

export async function initializeKnowledgeBase(): Promise<void> {
  if (isInitialized) {
    console.log('Knowledge base already initialized');
    return;
  }

  console.log('Initializing knowledge base...');
  console.log('Current working directory:', process.cwd());

  // Try multiple possible paths for the knowledge base file
  const possiblePaths = [
    path.join(process.cwd(), 'data', 'knowledge-base.txt'),
    path.join(__dirname, '..', '..', '..', 'data', 'knowledge-base.txt'),
    '/app/data/knowledge-base.txt',
  ];

  let knowledgeFilePath = '';
  let fileContent = '';

  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        console.log('Found knowledge base file at:', p);
        fileContent = fs.readFileSync(p, 'utf-8');
        knowledgeFilePath = p;
        break;
      }
    } catch (e) {
      // Continue to next path
    }
  }

  if (!fileContent || fileContent.trim().length === 0) {
    console.warn('Knowledge base file not found or empty');
    isInitialized = true;
    return;
  }

  console.log('Using knowledge base file:', knowledgeFilePath);

  // Remove comment lines (lines starting with #)
  const cleanContent = fileContent
    .split('\n')
    .filter(line => !line.trim().startsWith('#'))
    .join('\n');

  if (cleanContent.trim().length === 0) {
    console.warn('No content in knowledge base file (only comments)');
    isInitialized = true;
    return;
  }

  // Chunk the content
  const chunks = chunkText(cleanContent);
  console.log(`Created ${chunks.length} chunks from knowledge base`);

  if (chunks.length === 0) {
    console.warn('No chunks created from knowledge base');
    isInitialized = true;
    return;
  }

  // Generate embeddings for all chunks
  console.log('Generating embeddings...');
  const embeddings = await generateEmbeddings(chunks);

  // Store in knowledge base
  knowledgeBase = chunks.map((content, index) => ({
    id: `kb-${index}`,
    content,
    embedding: embeddings[index],
    metadata: {
      source: 'knowledge-base.txt',
      chunkIndex: index,
    },
  }));

  isInitialized = true;
  console.log(`Knowledge base initialized with ${knowledgeBase.length} chunks`);
}

export async function searchKnowledgeBase(
  query: string,
  topK: number = 3
): Promise<Array<{ chunk: DocumentChunk; score: number }>> {
  if (!isInitialized || knowledgeBase.length === 0) {
    console.warn('Knowledge base not initialized or empty');
    return [];
  }

  // Generate embedding for the query
  const queryEmbedding = await generateEmbedding(query);

  // Calculate similarity scores
  const scores = knowledgeBase.map(chunk => ({
    chunk,
    score: cosineSimilarity(queryEmbedding, chunk.embedding),
  }));

  // Sort by score and return top K
  return scores
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export function getKnowledgeBaseStatus(): { initialized: boolean; chunkCount: number } {
  return {
    initialized: isInitialized,
    chunkCount: knowledgeBase.length,
  };
}

export function getRelevantContext(
  results: Array<{ chunk: DocumentChunk; score: number }>
): { context: string; sources: string[] } {
  const context = results
    .map(r => r.chunk.content)
    .join('\n\n---\n\n');

  const sources = [...new Set(results.map(r => r.chunk.metadata.source))];

  return { context, sources };
}
