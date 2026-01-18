import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Update embeddings helper function
async function updateEmbeddings(documents: Document[]): Promise<Document[]> {
  try {
    // TODO: Implement embedding generation with HuggingFace
    const updatedDocs = documents.map((doc) => ({
      ...doc,
      is_embedded: true,
    }));
    return updatedDocs;
  } catch (error) {
    console.error('Error updating embeddings:', error);
    throw error;
  }
}

// Combined getPlan endpoint - fetches unembedded documents and updates embeddings
app.get('/api/plan', async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch unembedded plans
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_embedded', false);

    if (plansError) throw plansError;

    // Fetch unembedded entries
    const { data: entries, error: entriesError } = await supabase
      .from('entries')
      .select('*')
      .eq('is_embedded', false);

    if (entriesError) throw entriesError;

    // Combine and update embeddings
    const allDocuments = [...(plans || []), ...(entries || [])];
    const embeddedDocuments = await updateEmbeddings(allDocuments);

    res.json({
      plans: plans || [],
      entries: entries || [],
      embedded: embeddedDocuments,
    });
  } catch (error) {
    console.error('Error in getPlan endpoint:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
