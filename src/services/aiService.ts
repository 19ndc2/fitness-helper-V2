/**
 * AI Service Layer
 * 
 * This service provides backend access to the database using the service role key
 * which bypasses RLS (Row Level Security). Use this for AI operations that need
 * unrestricted database access.
 * 
 * Only use this client for:
 * - AI plan generation
 * - AI chat responses
 * - Backend operations that need to access user data across RLS policies
 */

import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ============================================================================
// CONFIGURATION
// ============================================================================

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_BACKEND_KEY = import.meta.env.VITE_SUPABASE_BACKEND_KEY;

if (!SUPABASE_URL) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!SUPABASE_BACKEND_KEY) {
  throw new Error('Missing VITE_SUPABASE_BACKEND_KEY environment variable');
}

// Initialize Supabase client with backend key (bypasses RLS)
const supabaseBackend: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_BACKEND_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// ============================================================================
// AI OPERATIONS
// ============================================================================

/**
 * Generate a workout plan using AI
 * This should call your backend AI endpoint
 */
export async function generateWorkoutPlan(userId: string, params: any) {
  // This will be implemented to call your backend AI service
  // For now, this is a placeholder
  console.log('Generating workout plan for user:', userId, params);
  throw new Error('generateWorkoutPlan not yet implemented');
}

/**
 * Get AI chat response
 * This should call your backend chat endpoint
 */
export async function getChatResponse(userId: string, message: string, context?: any) {
  // This will be implemented to call your backend chat service
  // For now, this is a placeholder
  console.log('Getting chat response for user:', userId, 'Message:', message);
  throw new Error('getChatResponse not yet implemented');
}

class HuggingFaceEmbeddings {
  apiKey: string;
  model: string;

  constructor(apiKey: string, model: string) {
    this.apiKey = apiKey;
    this.model = model; // e.g., 'sentence-transformers/all-MiniLM-L6-v2'
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const res = await fetch(`https://api-inference.huggingface.co/pipeline/feature-extraction/${this.model}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ inputs: texts }),
    });

    if (!res.ok) throw new Error(`HF API Error: ${res.statusText}`);
    const data = await res.json();

    // Hugging Face returns nested arrays; flatten if needed
    return data.map((vec: any) => vec.flat());
  }

  async embedQuery(text: string): Promise<number[]> {
    return (await this.embedDocuments([text]))[0];
  }
}






//function to get unembedded AI documents
export async function makeAiEmbeddings() {
  let unembeddedPlans: any = null;
  let unembeddedEntries: any = null;

  try {
    // Fetch all unembedded plans
    const { data, error: plansError } = await supabaseBackend
      .from('plans')
      .select('*')
      .eq('is_embedded', false);

    if (plansError) {
      throw new Error(`Failed to fetch unembedded plans: ${plansError.message}`);
    }

    unembeddedPlans = data;

    // Fetch all unembedded entries
    const { data: entriesData, error: entriesError } = await supabaseBackend
      .from('entries')
      .select('*')
      .eq('is_embedded', false);

    if (entriesError) {
      throw new Error(`Failed to fetch unembedded entries: ${entriesError.message}`);
    }

    unembeddedEntries = entriesData;

    console.log(`Found ${unembeddedPlans?.length || 0} unembedded plans and ${unembeddedEntries?.length || 0} unembedded entries`);
  } catch (error) {
    console.error('Error embedding AI docs:', error);
    throw error;
  }

  // Return the unembedded documents for further processing
  return {
    plans: unembeddedPlans || [],
    entries: unembeddedEntries || [],
  };



}





// Export the backend Supabase client for advanced operations
export { supabaseBackend };
