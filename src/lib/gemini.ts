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
