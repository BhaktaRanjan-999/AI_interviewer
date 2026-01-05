const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// USE THIS MODEL NAME - It is the current standard for speed and stability
const MODEL_NAME = "gemini-2.5-flash"; 

const sessions = new Map();

// --- Endpoint 1: Chat Loop ---
app.post('/chat', async (req, res) => {
  const { message, sessionId, jobRole } = req.body;

  try {
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    // Initialize session if it doesn't exist
    if (!sessions.has(sessionId)) {
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: `You are a strict technical interviewer for a ${jobRole} role. 
            1. Ask ONE question at a time.
            2. Wait for my answer.
            3. If my answer is short, ask a follow-up. 
            4. Start by asking me to introduce myself.` }]
          },
          {
            role: "model",
            parts: [{ text: "Understood. Please introduce yourself." }]
          }
        ],
      });
      sessions.set(sessionId, chat);
    }

    const chatSession = sessions.get(sessionId);

    // Prompt Engineering for JSON response
    const wrappedMessage = `
      The candidate just said: "${message}"
      
      1. Analyze this answer.
      2. Provide a very short tip (max 15 words) as "feedback".
      3. Ask the next question as "question".
      
      Return ONLY raw JSON (no markdown, no backticks):
      {
        "feedback": "constructive tip here",
        "question": "next question here"
      }
    `;

    const result = await chatSession.sendMessage(wrappedMessage);
    const response = await result.response;
    const text = response.text();
    
    // Cleanup JSON string just in case Gemini adds markdown
    const cleanJson = text.replace(/```json|```/g, '').trim();
    const data = JSON.parse(cleanJson);
    
    res.json(data);

  } catch (error) {
    console.error("Chat Error:", error);
    // Return a fallback so the app doesn't crash
    res.status(500).json({ 
        feedback: "Error connecting to AI.", 
        question: "Let's move on. Tell me about your strengths." 
    });
  }
});

// --- Endpoint 2: Final Feedback ---
app.post('/feedback', async (req, res) => {
  const { sessionId } = req.body;
  const chatSession = sessions.get(sessionId);

  if (!chatSession) {
    return res.status(404).json({ error: "Session not found" });
  }

  try {
    const history = await chatSession.getHistory();
    const analysisModel = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
      Analyze this interview history: ${JSON.stringify(history)}
      
      Return ONLY raw JSON (no markdown):
      {
        "score": "number 1-10",
        "strengths": ["strength 1", "strength 2"],
        "improvements": ["improvement 1", "improvement 2"],
        "suggested_answers": "Rewrite the user's weakest answer to be perfect."
      }
    `;

    const result = await analysisModel.generateContent(prompt);
    const text = result.response.text();
    const cleanJson = text.replace(/```json|```/g, '').trim();
    
    res.json(JSON.parse(cleanJson));

  } catch (error) {
     console.error("Feedback Error:", error);
     res.status(500).json({ error: "Could not generate report." });
  }
});

app.listen(5000, () => console.log('Server running on port 5000'));