import express, { Request, Response } from 'express';
import cors from 'cors';
import {
  updateEmbeddings,
  fetchUnembeddedDocuments,
  saveEmbeddingsToDB,
  ragCall, // ✅ Import ragCall from aiService
} from './aiService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// ---------------------- Prompt Template ----------------------
const fitnessPlanPromptTemplate = (context: string[], goal: string, input: string) => {
  const contextText = context.length ? context.join('\n\n') : 'No previous context available.';
  return `
You are a fitness coach AI. 

User Goal: ${goal}

User Input: ${input}

Use the following relevant context from the user’s previous plans and entries (include the date):
${contextText}

Create a detailed fitness plan for the user based on the goal and input. Respond in clear structured text.
`;
};

// ---------------------- Generate fitness plan endpoint ----------------------
app.post('/plan/generate', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req.query.userId as string) || req.body.userId;

    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    // Step 1: Fetch unembedded plans and entries
    const { plans, entries } = await fetchUnembeddedDocuments();

    // Step 2: Combine and update embeddings
    const allDocuments = [...plans, ...entries];
    const embeddedDocuments = await updateEmbeddings(allDocuments);

    // Step 3: Save embeddings to database
    await saveEmbeddingsToDB(embeddedDocuments, userId);

    // Step 4: Call RAG + LLM (chatCompletion) for the fitness plan
    const responseText = await ragCall({
      userId,
      input: req.body.input || 'Create a new fitness plan',
      model: 'google/gemma-3-4b-instruct:free', // ✅ Use a working HF model
      promptTemplate: fitnessPlanPromptTemplate,
      embeddingModel: 'sentence-transformers/all-mpnet-base-v2',
      topK: 5,
    });

    res.json({
      success: true,
      fitnessPlan: responseText,
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
