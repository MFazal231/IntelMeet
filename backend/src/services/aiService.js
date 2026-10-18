import env from '../config/env.js';

function buildMeetingPrompt({ title, transcript }) {
  return `Summarize this meeting titled "${title}" into a concise executive summary, key decisions, and action items.\n\nTranscript:\n${transcript || 'No transcript provided.'}`;
}

async function callGemini(prompt) {
  const model = env.geminiModel || 'gemini-2.0-flash';
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(env.geminiApiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
        },
      }),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini request failed (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('') || 'No summary generated.';
}

async function callOpenAI(prompt) {
  const { OpenAI } = await import('openai');
  const client = new OpenAI({ apiKey: env.openAIApiKey });
  const response = await client.responses.create({
    model: env.openAIModel,
    input: prompt,
  });

  return response.output_text || 'No summary generated.';
}

export async function summarizeMeeting({ transcript = '', title = 'Meeting' }) {
  const provider = env.geminiApiKey ? 'gemini' : env.openAIApiKey ? 'openai' : null;

  if (!provider) {
    return {
      status: 'unavailable',
      title,
      summary: 'AI integration is not configured yet. Add GEMINI_API_KEY or OPENAI_API_KEY in the backend environment to enable AI-generated meeting notes.',
      decisions: ['Configuration pending'],
      actionItems: ['Add a real transcription source and set API keys'],
      keyPoints: ['AI notes are intentionally disabled until credentials are configured.'],
    };
  }

  try {
    const prompt = buildMeetingPrompt({ title, transcript });
    const text = provider === 'gemini' ? await callGemini(prompt) : await callOpenAI(prompt);

    return {
      status: 'ready',
      title,
      summary: text,
      decisions: ['Detected from transcript'],
      actionItems: ['Review and confirm AI-detected action items'],
      keyPoints: [`AI summary generated with ${provider === 'gemini' ? 'Gemini' : 'OpenAI'}`],
    };
  } catch (error) {
    return {
      status: 'error',
      title,
      summary: 'AI summary generation failed. Please verify the API key and model configuration.',
      decisions: [],
      actionItems: [],
      keyPoints: [error.message || 'Unknown error'],
    };
  }
}
