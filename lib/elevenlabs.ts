export async function generateSynthiaAudio(text: string) {
  const VOICE_ID = process.env.SYNTHIA_VOICE_ID;
  const API_KEY = process.env.ELEVENLABS_API_KEY;

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "xi-api-key": API_KEY || "",
    },
    body: JSON.stringify({
      text: text,
      model_id: "eleven_monolingual_v1",
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}