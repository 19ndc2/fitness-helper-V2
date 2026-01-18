import express, { Request, Response } from 'express';
import cors from 'cors';
import { updateEmbeddings, fetchUnembeddedDocuments, saveEmbeddingsToDB } from './aiService';


const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Supabase with service role key (backend only)


// Generate fitness plan endpoint
app.post('/plan/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.query.userId as string || req.body.userId;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Fetch unembedded plans and entries
    const { plans, entries } = await fetchUnembeddedDocuments();

    // Combine and update embeddings
    const allDocuments = [...plans, ...entries];
    const embeddedDocuments = await updateEmbeddings(allDocuments);

    // Save embeddings to database
    await saveEmbeddingsToDB(embeddedDocuments, userId);

    res.json({
      success: true,
      message: 'Embeddings generated and saved successfully',
    });
  } catch (error) {
    console.error('Error in plan/generate endpoint:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
