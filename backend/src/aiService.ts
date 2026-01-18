import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InferenceClient } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

// ---------------------- Supabase Setup ----------------------
const supabase: SupabaseClient = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

interface Document {
  id: string;
  is_embedded: boolean;
  [key: string]: unknown;
}

// ---------------------- Hugging Face Embeddings ----------------------
export class HuggingFaceLangChainEmbeddings {
  client: InferenceClient;
  model: string;

  constructor(apiKey: string, model: string) {
    this.client = new InferenceClient(apiKey);
    this.model = model;
  }

  /** Embed multiple documents */
  async embedDocuments(documents: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const doc of documents) {
      const res = await this.client.featureExtraction({
        model: this.model,
        inputs: doc,
        provider: 'hf-inference',
      });

      if (!Array.isArray(res)) throw new Error('HF API response is not an array');

      // Flatten any nested arrays so we always return number[]
      const flatEmbedding = Array.isArray(res[0]) ? (res as number[][]).flat() : (res as number[]);
      embeddings.push(flatEmbedding);
    }

    return embeddings;
  }

  /** Embed a single query */
  async embedQuery(document: string): Promise<number[]> {
    return (await this.embedDocuments([document]))[0];
  }
}

// ---------------------- Update Embeddings ----------------------
export async function updateEmbeddings(documents: Document[]): Promise<Document[]> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) throw new Error('HUGGINGFACE_API_KEY environment variable is not set');

    const embedder = new HuggingFaceLangChainEmbeddings(
      apiKey,
      'sentence-transformers/all-mpnet-base-v2'
    );

    const texts = documents.map((doc: any) => {
      const textParts = [
        doc.title || doc.name || '',
        doc.description || '',
        doc.content || doc.notes || '',
      ]
        .filter((text: string) => text.length > 0)
        .join(' ');
      return textParts || 'No content';
    });

    const embeddings = await embedder.embedDocuments(texts);

    return documents.map((doc, idx) => ({
      ...doc,
      embedding: embeddings[idx],
      is_embedded: true,
    }));
  } catch (error) {
    console.error('Error updating embeddings:', error);
    throw error;
  }
}

// ---------------------- Fetch unembedded documents ----------------------
export async function fetchUnembeddedDocuments() {
  try {
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_embedded', false);
    if (plansError) throw plansError;

    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .eq('is_embedded', false);
    if (entriesError) throw entriesError;

    return { plans: plans || [], entries: entries || [] };
  } catch (error) {
    console.error('Error fetching unembedded documents:', error);
    throw error;
  }
}

// ---------------------- Save embeddings to database ----------------------
export async function saveEmbeddingsToDB(updatedDocs: any[], userId: string) {
  try {
    const plans = updatedDocs.filter((doc: any) => doc.plan_text);
    const entries = updatedDocs.filter((doc: any) => doc.content && !doc.plan_text);

    for (const plan of plans) {
      const { error: planError } = await supabase
        .from('plans')
        .update({ is_embedded: true })
        .eq('id', plan.id);
      if (planError) throw planError;

      const { error: docError } = await supabase
        .from('ai_docs')
        .insert({
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
      const { error: entryError } = await supabase
        .from('entries')
        .update({ is_embedded: true })
        .eq('id', entry.id);
      if (entryError) throw entryError;

      const { error: docError } = await supabase
        .from('ai_docs')
        .insert({
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
