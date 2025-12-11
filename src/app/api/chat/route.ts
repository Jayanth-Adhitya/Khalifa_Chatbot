import { NextRequest, NextResponse } from 'next/server';
import { chat } from '@/lib/gemini';
import { searchKnowledgeBase, getRelevantContext, initializeKnowledgeBase } from '@/lib/knowledge-base';

interface ChatRequest {
  message: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(request: NextRequest) {
  try {
    // Check if Gemini API key is configured
    if (!process.env.GEMINI_API_KEY) {
      console.error('GEMINI_API_KEY is not configured');
      return NextResponse.json(
        { error: 'Gemini API key not configured', response: 'Server configuration error. Please set GEMINI_API_KEY.' },
        { status: 500 }
      );
    }

    const body: ChatRequest = await request.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('Chat request received:', message);

    // Ensure knowledge base is initialized
    await initializeKnowledgeBase();

    // Search for relevant context
    const searchResults = await searchKnowledgeBase(message, 3);
    const { context, sources } = getRelevantContext(searchResults);

    console.log('Context found:', context ? 'yes' : 'no', 'Sources:', sources);

    // Generate response using Gemini (language is auto-detected)
    const { response, detectedLanguage } = await chat(
      message,
      context || '',
      history || []
    );

    console.log('Gemini response received, language:', detectedLanguage);

    return NextResponse.json({
      response,
      sources,
      language: detectedLanguage,
    });
  } catch (error) {
    console.error('Chat API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to process chat request', details: errorMessage },
      { status: 500 }
    );
  }
}
