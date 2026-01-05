// server/check_models.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function check() {
  console.log("Checking available models...");
  try {
    // This lists the models your API key actually has access to
    const modelResponse = await genAI.getGenerativeModel({ model: "gemini-pro" }).apiKey; 
    // The SDK doesn't always expose listModels directly in older versions, 
    // so let's try a direct fetch using standard fetch to see the raw error or success.
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`
    );
    
    const data = await response.json();
    
    if (data.error) {
      console.error("❌ API KEY ERROR:", data.error.message);
      console.log("\nSOLUTION: You must enable the 'Google Generative Language API' in Cloud Console.");
    } else {
      console.log("✅ AVAILABLE MODELS:");
      data.models.forEach(m => console.log(` - ${m.name}`));
    }
  } catch (error) {
    console.error("Network Error:", error);
  }
}

check();