import { NextResponse } from 'next/server';
import { initializeKnowledgeBase, getKnowledgeBaseStatus } from '@/lib/knowledge-base';

export async function GET() {
  try {
    await initializeKnowledgeBase();
    const status = getKnowledgeBaseStatus();

    return NextResponse.json({
      success: true,
      message: 'Knowledge base initialized',
      ...status,
    });
  } catch (error) {
    console.error('Init API error:', error);
    return NextResponse.json(
      { error: 'Failed to initialize knowledge base' },
      { status: 500 }
    );
  }
}
