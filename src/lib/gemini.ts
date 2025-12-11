import { GoogleGenerativeAI } from '@google/generative-ai';
import natural from 'natural';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Use TF-IDF for embeddings (simple, no external dependencies)
const TfIdf = natural.TfIdf;
let tfidf: InstanceType<typeof TfIdf> | null = null;
let documentTexts: string[] = [];

function initTfIdf(texts: string[]) {
  tfidf = new TfIdf();
  documentTexts = texts;
  for (const text of texts) {
    tfidf.addDocument(text);
  }
  console.log('TF-IDF initialized with', texts.length, 'documents');
}

// Simple bag-of-words embedding using TF-IDF weights
function getSimpleEmbedding(text: string, vocabulary: string[]): number[] {
  const words = text.toLowerCase().split(/\s+/);
  const embedding = new Array(vocabulary.length).fill(0);

  for (const word of words) {
    const idx = vocabulary.indexOf(word);
    if (idx !== -1) {
      embedding[idx] += 1;
    }
  }

  // Normalize
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  if (magnitude > 0) {
    for (let i = 0; i < embedding.length; i++) {
      embedding[i] /= magnitude;
    }
  }

  return embedding;
}

// Build vocabulary from all texts
let vocabulary: string[] = [];

export async function generateEmbedding(text: string): Promise<number[]> {
  return getSimpleEmbedding(text, vocabulary);
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  // Build vocabulary from all texts
  const wordSet = new Set<string>();
  for (const text of texts) {
    const words = text.toLowerCase().split(/\s+/);
    words.forEach(w => wordSet.add(w));
  }
  vocabulary = Array.from(wordSet).slice(0, 5000); // Limit vocabulary size

  console.log('Building embeddings with vocabulary size:', vocabulary.length);

  // Initialize TF-IDF
  initTfIdf(texts);

  // Generate embeddings
  const embeddings: number[][] = [];
  for (let i = 0; i < texts.length; i++) {
    if (i % 10 === 0) {
      console.log(`Processing embeddings ${i + 1}/${texts.length}`);
    }
    embeddings.push(getSimpleEmbedding(texts[i], vocabulary));
  }

  return embeddings;
}

// Simple language detection based on character ranges
export function detectLanguage(text: string): 'ar' | 'en' {
  // Arabic Unicode range: \u0600-\u06FF
  const arabicChars = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinChars = (text.match(/[a-zA-Z]/g) || []).length;

  return arabicChars > latinChars ? 'ar' : 'en';
}

export async function chat(
  message: string,
  context: string,
  history: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ response: string; detectedLanguage: 'ar' | 'en' }> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Detect language from the user's message
  const detectedLanguage = detectLanguage(message);

  const systemPrompt = `You are Khalifa, a friendly assistant for UAE Ministry of Economy and Tourism services.

Knowledge base context:
${context}

RESPONSE STYLE - CRITICAL:
- Speak naturally like a helpful human, not a robot
- Keep responses SHORT - two to three sentences max
- Be warm and conversational
- Use simple, everyday language
- Write numbers as words (say "three" not "3")
- Avoid bullet points, lists, or formal formatting
- No markdown, asterisks, or special characters
- If you don't know something, just say so naturally

LANGUAGE:
- Match the user's language exactly
- ${detectedLanguage === 'ar' ? 'Respond in Arabic - use natural spoken Arabic' : 'Respond in English - use casual, friendly English'}

Remember: Your response will be spoken aloud, so write exactly how you'd naturally say it in conversation.`;

  const chatHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: detectedLanguage === 'ar' ? 'تمام، أنا جاهز للمساعدة!' : 'Got it, happy to help!' }] },
      ...chatHistory,
    ],
  });

  const result = await chat.sendMessage(message);
  const response = result.response;

  return {
    response: response.text(),
    detectedLanguage,
  };
}
