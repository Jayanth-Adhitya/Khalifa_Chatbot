export type Language = 'en' | 'ar';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export interface ChatRequest {
  message: string;
  language: Language;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export interface ChatResponse {
  response: string;
  sources: string[];
}

export interface TTSRequest {
  text: string;
  language: Language;
}

export interface STTResponse {
  text: string;
  language?: string;
}

export interface DocumentChunk {
  id: string;
  content: string;
  embedding: number[];
  metadata: {
    source: string;
    chunkIndex: number;
  };
}

export interface KnowledgeBase {
  chunks: DocumentChunk[];
  initialized: boolean;
}
