import { DocumentChunk } from '@/types';
import { generateEmbedding, generateEmbeddings } from './gemini';
import { processAllPDFs, TextChunk } from './pdf-processor';
import path from 'path';

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

export async function initializeKnowledgeBase(): Promise<void> {
  if (isInitialized) {
    console.log('Knowledge base already initialized');
    return;
  }

  console.log('Initializing knowledge base...');

  // Get the data directory path
  const dataDir = path.join(process.cwd(), 'data');

  // Process all PDFs
  const chunks = await processAllPDFs(dataDir);

  if (chunks.length === 0) {
    console.warn('No chunks found to embed');
    isInitialized = true;
    return;
  }

  // Generate embeddings for all chunks
  console.log('Generating embeddings...');
  const contents = chunks.map(chunk => chunk.content);
  const embeddings = await generateEmbeddings(contents);

  // Store in knowledge base
  knowledgeBase = chunks.map((chunk, index) => ({
    id: `${chunk.source}-${chunk.chunkIndex}`,
    content: chunk.content,
    embedding: embeddings[index],
    metadata: {
      source: chunk.source,
      chunkIndex: chunk.chunkIndex,
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
