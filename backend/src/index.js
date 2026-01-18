import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase with service role key (backend only)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Get unembedded AI documents
app.get('/api/embeddings/unembedded', async (req, res) => {
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

    res.json({
      plans: plans || [],
      entries: entries || [],
    });
  } catch (error) {
    console.error('Error fetching unembedded docs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create embeddings endpoint
app.post('/api/embeddings/make', async (req, res) => {
  try {
    // TODO: Implement embedding generation with HuggingFace
    res.status(501).json({ error: 'Not implemented yet' });
  } catch (error) {
    console.error('Error creating embeddings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
