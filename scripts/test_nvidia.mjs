import fs from 'fs';
import path from 'path';

// Parse .env.local manually
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        let val = trimmed.slice(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
} catch {
  // ignore
}

const apiKey = process.env.NVIDIA_API_KEY;
const baseUrl = process.env.NVIDIA_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const model = process.env.NVIDIA_VISION_MODEL || 'z-ai/glm-5.3-flash';

console.log('Testing NVIDIA Connection & Multimodal Inference...');
console.log(`Base URL: ${baseUrl}`);
console.log(`Model:    ${model}`);
console.log(`API Key configured: ${Boolean(apiKey && apiKey.length > 10)}`);

async function run() {
  if (!apiKey) {
    console.error('NVIDIA_API_KEY is not configured in .env.local');
    process.exit(1);
  }

  // 1. Check models endpoint
  const res = await fetch(`${baseUrl}/models`, {
    headers: { Authorization: `Bearer ${apiKey}` }
  });
  console.log(`Endpoint /models HTTP status: ${res.status}`);
  if (!res.ok) {
    console.error('Failed to connect to NVIDIA API catalog.');
    process.exit(1);
  }

  // 2. Multimodal image analysis
  const imgPath = path.resolve(process.cwd(), 'storage/thumbnails/pipeline_test_thumb.jpg');
  if (!fs.existsSync(imgPath)) {
    console.error(`Test image not found at ${imgPath}`);
    process.exit(1);
  }

  const base64Img = fs.readFileSync(imgPath).toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Img}`;

  const candidates = ['z-ai/glm-5.3-flash', 'zai-org/GLM-5.3-Flash'];
  let success = false;

  for (const candidate of candidates) {
    console.log(`Attempting multimodal call with model: ${candidate}`);
    const chatRes = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: candidate,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Describe the main visual content and colors in this video frame in one short sentence.' },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 100,
        temperature: 0.2
      })
    });

    console.log(`Model ${candidate} response status: ${chatRes.status}`);
    if (chatRes.ok) {
      const data = await chatRes.json();
      const content = data.choices?.[0]?.message?.content;
      console.log(`SUCCESS! Vision description received: "${content?.trim()}"`);
      success = true;
      break;
    } else {
      const errText = await chatRes.text();
      console.warn(`Attempt failed with status ${chatRes.status}: ${errText.substring(0, 150)}`);
    }
  }

  if (success) {
    console.log('\nNVIDIA MULTIMODAL VISION VERIFIED: PASS');
  } else {
    console.error('\nNVIDIA MULTIMODAL VISION FAILED');
    process.exit(1);
  }
}

run().catch((err) => {
  console.error('Fatal error during NVIDIA test:', err);
  process.exit(1);
});
