import { GoogleGenerativeAI, EmbedContentRequest } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function generateEmbedding(text: string): Promise<number[]> {
  const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

  const result = await model.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: 'RETRIEVAL_DOCUMENT' as EmbedContentRequest['taskType'],
  });

  return result.embedding.values;
}

export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];

  // Process in batches of 10 to avoid rate limits
  const batchSize = 10;
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const batchEmbeddings = await Promise.all(
      batch.map(text => generateEmbedding(text))
    );
    embeddings.push(...batchEmbeddings);
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

  const systemPrompt = `You are an intelligent assistant specializing in UAE Ministry of Economy and Tourism services.

Use the following information from the knowledge base to answer user questions:
${context}

CRITICAL INSTRUCTIONS:
1. ALWAYS respond in the SAME LANGUAGE as the user's message
2. If the user writes in Arabic, respond entirely in Arabic
3. If the user writes in English, respond entirely in English
4. Be polite and helpful
5. If you cannot find the information in the provided context, acknowledge this and suggest contacting the ministry directly
6. Provide clear and concise answers
7. The knowledge base contains Arabic documents about government services - you can reference this information regardless of the language you respond in

Current user message language: ${detectedLanguage === 'ar' ? 'Arabic' : 'English'}`;

  const chatHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: [
      { role: 'user', parts: [{ text: systemPrompt }] },
      { role: 'model', parts: [{ text: detectedLanguage === 'ar' ? 'مفهوم، سأرد بنفس لغة المستخدم.' : 'Understood, I will respond in the same language as the user.' }] },
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
