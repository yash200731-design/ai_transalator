import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Lazily initialize/check API key upon requests to prevent immediate crash if not configured.
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not defined. Please add it via Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function translateWithGemini(text: string, source: string, target: string): Promise<string> {
  const ai = getGeminiClient();

  const prompt = `Translate the following text precisely to the target language.
Original Source language (hint/instructions): ${source === "auto" ? "detect automatically" : source}
Desired Target language (ISO code): ${target}

Input text to translate:
"${text}"`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      systemInstruction: "You are a professional, high-fidelity multi-language translator. You accurately translate any text to the requested target language (including support for EN, ES, FR, DE, IT, PT, RU, ZH, JA, KO, AR, HI, TR, NL, PL, SV, VI). Always output JSON conforming exactly to the responseSchema. Fill 'translatedText' with the precisely translated string and 'detectedLanguage' with the 2-letter ISO code representing the source text language (e.g. 'en', 'es', 'hi', 'ja', 'fr', 'de'). No comments, explanations or markdown block wrappers.",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          translatedText: {
            type: Type.STRING,
            description: "The accurately translated text.",
          },
          detectedLanguage: {
            type: Type.STRING,
            description: "The 2-letter ISO language code representing the source text.",
          },
        },
        required: ["translatedText", "detectedLanguage"],
      },
      temperature: 0.1,
    },
  });

  const responseText = response.text?.trim() || "";
  console.log("Gemini API translation output:", responseText);
  return responseText;
}

const app = express();
const PORT = 3000;

app.use(express.json());

// API health status check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    geminiActive: !!process.env.GEMINI_API_KEY,
    openaiActive: !!process.env.OPENAI_API_KEY,
    active: !!process.env.GEMINI_API_KEY || !!process.env.OPENAI_API_KEY
  });
});

// API route for performing actual high-fidelity translations
app.post("/api/translate", async (req, res) => {
  const { text, source, target } = req.body;

  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text is required for translation" });
  }

  try {
    let responseText = "";

    if (process.env.OPENAI_API_KEY) {
      try {
        // Formulate prompt for high-quality translation
        const prompt = `Translate the following text precisely to the target language.
Original Source language (hint/instructions): ${source === "auto" ? "detect automatically" : source}
Desired Target language (ISO code): ${target}

Input text to translate:
"${text}"`;

        const systemInstruction = "You are a professional, high-fidelity multi-language translator. You accurately translate any text to the requested target language (including support for EN, ES, FR, DE, IT, PT, RU, ZH, JA, KO, AR, HI, TR, NL, PL, SV, VI). Always output JSON conforming exactly to the responseSchema. Fill 'translatedText' with the precisely translated string and 'detectedLanguage' with the 2-letter ISO code representing the source text language (e.g. 'en', 'es', 'hi', 'ja', 'fr', 'de'). No comments, explanations or markdown block wrappers.";

        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: `${systemInstruction}\n\nResponse Schema: { "translatedText": "string", "detectedLanguage": "string" }` },
              { role: "user", content: prompt }
            ],
            temperature: 0.1
          })
        });

        if (!openaiResponse.ok) {
          const errText = await openaiResponse.text();
          throw new Error(`OpenAI API responded with status ${openaiResponse.status}: ${errText}`);
        }

        const data = await openaiResponse.json() as any;
        responseText = data.choices?.[0]?.message?.content?.trim() || "";
        console.log("OpenAI API translation output:", responseText);
      } catch (openaiError: any) {
        console.warn("OpenAI translation failed, trying Gemini fallback:", openaiError.message);
        if (process.env.GEMINI_API_KEY) {
          responseText = await translateWithGemini(text, source, target);
        } else {
          throw openaiError;
        }
      }
    } else {
      responseText = await translateWithGemini(text, source, target);
    }

    if (!responseText) {
      throw new Error("Empty response received from the translation API");
    }

    // Parse structured translation outcome
    const resultObj = JSON.parse(responseText);
    
    return res.json({
      translatedText: resultObj.translatedText,
      detectedLanguage: resultObj.detectedLanguage || (source === "auto" ? "en" : source),
      isFallback: false,
    });

  } catch (error: any) {
    console.error("Translation Endpoint Error:", error);
    return res.status(500).json({
      error: error.message || "An error occurred while calling the translation API. Please make sure your API keys are configured."
    });
  }
});

// Setup server listening and middlewares only if NOT running as a serverless function on Vercel
async function startServer() {
  // Integrate Vite middleware for assets/client SPA in dev, direct handling in prod
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 and port 3000 as required for container ingress routing
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server active on environment port ${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
