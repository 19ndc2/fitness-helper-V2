import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InferenceClient } from '@huggingface/inference'; // still used for embeddings
import dotenv from 'dotenv';

dotenv.config();

// ---------------------- Supabase Setup ----------------------
export const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ---------------------- Types ----------------------
export interface Document {
  id: string;
  is_embedded: boolean;
  [key: string]: unknown;
}

export interface RagRequest {
  userId: string;
  input: string;
  model: string; // for OpenRouter this will be like "openrouter/some-model"
  promptTemplate: (context: string[], goal: string, input: string) => string;
  embeddingModel: string;
  topK?: number;
}

export interface RagContextDoc {
  content: string;
  metadata?: {
    created_at?: string;
    timestamp?: string;
  };
}

interface ChatCompletionRequestMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  [key: string]: any;
}

// ---------------------- Hugging Face Embeddings ----------------------
export class HuggingFaceLangChainEmbeddings {
  client: InferenceClient;
  model: string;

  constructor(apiKey: string, model: string) {
    this.client = new InferenceClient(apiKey);
    this.model = model;
  }

  async embedDocuments(documents: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const doc of documents) {
      const res = await this.client.featureExtraction({
        model: this.model,
        inputs: doc,
        provider: 'hf-inference',
      });
      if (!Array.isArray(res)) throw new Error('HF API response is not an array');
      const flatEmbedding = Array.isArray(res[0]) ? (res as number[][]).flat() : (res as number[]);
      embeddings.push(flatEmbedding);
    }
    return embeddings;
  }

  async embedQuery(document: string): Promise<number[]> {
    return (await this.embedDocuments([document]))[0];
  }
}

// ---------------------- Update Embeddings ----------------------
export async function updateEmbeddings(documents: Document[]): Promise<Document[]> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) throw new Error('HUGGINGFACE_API_KEY is not set');

  const embedder = new HuggingFaceLangChainEmbeddings(apiKey, 'sentence-transformers/all-mpnet-base-v2');
  const texts = documents.map((doc: any) => {
    const textParts = [doc.title || doc.name || '', doc.description || '', doc.content || doc.notes || '']
      .filter(Boolean)
      .join(' ');
    return textParts || 'No content';
  });

  const embeddings = await embedder.embedDocuments(texts);

  return documents.map((doc, idx) => ({ ...doc, embedding: embeddings[idx], is_embedded: true }));
}

// ---------------------- Fetch unembedded documents ----------------------
export async function fetchUnembeddedDocuments() {
  const { data: plans, error: plansError } = await supabase.from('plans').select('*').eq('is_embedded', false);
  if (plansError) throw plansError;
  const { data: entries, error: entriesError } = await supabase.from('entries').select('*').eq('is_embedded', false);
  if (entriesError) throw entriesError;
  return { plans: plans || [], entries: entries || [] };
}

// ---------------------- Save embeddings to database ----------------------
export async function saveEmbeddingsToDB(updatedDocs: any[], userId: string) {
  try {
    const plans = updatedDocs.filter((doc: any) => doc.plan_text);
    const entries = updatedDocs.filter((doc: any) => doc.content && !doc.plan_text);

    for (const plan of plans) {
      const { error: planError } = await supabase.from('plans').update({ is_embedded: true }).eq('id', plan.id);
      if (planError) throw planError;
      const { error: docError } = await supabase.from('ai_docs').insert({
        user_id: userId,
        type: 'plan',
        content: plan.plan_text,
        vector: plan.embedding,
        embedding_model: 'sentence-transformers/all-mpnet-base-v2',
        metadata: { source_id: plan.id, generated_at: plan.generated_at },
      });
      if (docError) throw docError;
    }

    for (const entry of entries) {
      const { error: entryError } = await supabase.from('entries').update({ is_embedded: true }).eq('id', entry.id);
      if (entryError) throw entryError;
      const { error: docError } = await supabase.from('ai_docs').insert({
        user_id: userId,
        type: entry.type,
        content: entry.content,
        vector: entry.embedding,
        embedding_model: 'sentence-transformers/all-mpnet-base-v2',
        metadata: { source_id: entry.id, entry_type: entry.type, timestamp: entry.timestamp },
      });
      if (docError) throw docError;
    }

    console.log(`Saved ${plans.length} plan embeddings and ${entries.length} entry embeddings`);
  } catch (error) {
    console.error('Error saving embeddings to database:', error);
    throw error;
  }
}

// ---------------------- Fetch user goal ----------------------
async function fetchUserGoal(userId: string): Promise<string> {
  const { data, error } = await supabase.from('app_users').select('goal').eq('id', userId).single();
  if (error || !data) {
    console.warn(`Could not fetch goal for user ${userId}, using empty string`);
    return '';
  }
  return data.goal || '';
}

// ---------------------- Fetch RAG context ----------------------
async function fetchRagContext(userId: string, queryEmbedding: number[], topK = 5): Promise<RagContextDoc[]> {
  const { data: docs, error } = await supabase.rpc('match_vectors', {
    match_user_id: userId,
    match_embedding: queryEmbedding,
    match_limit: topK,
  });
  if (error) {
    console.error('Error fetching RAG context:', error);
    return [];
  }
  return docs || [];
}

// ---------------------- RAG + OpenRouter ----------------------
// ---------------------- RAG + OpenRouter ----------------------
export async function ragCall({
  userId,
  input,
  promptTemplate,
  embeddingModel,
  topK = 5,
  model,
}: RagRequest) {
  const apiKey = process.env.OPEN_ROUTER_API_KEY;
  if (!apiKey) throw new Error('OPEN_ROUTER_API_KEY is not set');

  // 1️⃣ Get user goal
  const goal = await fetchUserGoal(userId);

  // 2️⃣ Embed user input (still using HF embeddings)
  const embedder = new HuggingFaceLangChainEmbeddings(
    process.env.HUGGINGFACE_API_KEY || '',
    embeddingModel
  );
  const queryEmbedding = await embedder.embedQuery(input);

  // 3️⃣ Fetch RAG context
  const contextDocs = await fetchRagContext(userId, queryEmbedding, topK);
  const contextStrings = contextDocs.map(
    (c: RagContextDoc) =>
      `${c.content}\nDate: ${c.metadata?.created_at || c.metadata?.timestamp || 'unknown'}`
  );

  // 4️⃣ Build final prompt
  const finalPrompt = promptTemplate(contextStrings, goal, input);
  console.log('=== FINAL PROMPT SENT TO OPENROUTER ===');
  console.log(finalPrompt);
  console.log('======================================');

  // 5️⃣ Call OpenRouter REST API directly
  const response = await fetch(`https://openrouter.ai/api/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model, // e.g., "google/gemma-3-4b-it:free"
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: finalPrompt,
            },
          ],
        },
      ],
      parameters: {
        max_new_tokens: 512,
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  // OpenRouter returns messages in choices[0].message.content
  const messageArray = data.choices?.[0]?.message?.content || [];
  // Flatten content array into single string
  const resultText = messageArray
    .map((item: any) => (item.type === 'text' ? item.text : ''))
    .join('\n');

  return resultText;
}
