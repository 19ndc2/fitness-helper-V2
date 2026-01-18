import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { InferenceClient } from '@huggingface/inference';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Supabase with service role key (backend only)
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
export class HuggingFaceEmbeddings {
  client: InferenceClient;
  model: string;

  constructor(apiKey: string, model: string) {
    this.client = new InferenceClient(apiKey);
    this.model = model;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const res = await this.client.featureExtraction({
        model: this.model,
        inputs: text,
        provider: 'hf-inference',
      });

      if (!Array.isArray(res)) {
        throw new Error('HF API response is not an array');
      }

      embeddings.push(res as number[]);
    }

    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    return (await this.embedDocuments([text]))[0];
  }
}

// ---------------------- Update Embeddings ----------------------
export async function updateEmbeddings(documents: Document[]): Promise<Document[]> {
  try {
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      throw new Error('HUGGINGFACE_API_KEY environment variable is not set');
    }

    const embedder = new HuggingFaceEmbeddings(apiKey, 'sentence-transformers/all-mpnet-base-v2');

    // Extract text from documents
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

    // Attach embeddings to documents
    return documents.map((doc, index) => ({
      ...doc,
      embedding: embeddings[index],
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

    return {
      plans: plans || [],
      entries: entries || [],
    };
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

    // Save plan embeddings
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
          metadata: {
            source_id: plan.id,
            generated_at: plan.generated_at,
          },
        });

      if (docError) throw docError;
    }

    // Save entry embeddings
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
          metadata: {
            source_id: entry.id,
            entry_type: entry.type,
            timestamp: entry.timestamp,
          },
        });

      if (docError) throw docError;
    }

    console.log(
      `Successfully saved ${plans.length} plan embeddings and ${entries.length} entry embeddings`
    );
  } catch (error) {
    console.error('Error saving embeddings to database:', error);
    throw error;
  }
}
