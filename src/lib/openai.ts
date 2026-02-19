import {
  OPENAI_API_URL,
  OPENAI_MODEL,
  OPENAI_TIMEOUT_MS,
  ASPECT_RATIO_TO_OPENAI_SIZE,
  RESOLUTION_TO_OPENAI_QUALITY,
} from "@/lib/constants";

interface OpenAIImageResult {
  imageData: string; // raw base64 (no data URL prefix)
  mimeType: string;
}

export async function generateWithOpenAI(
  prompt: string,
  aspectRatio: string,
  resolution: string,
): Promise<OpenAIImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const size = ASPECT_RATIO_TO_OPENAI_SIZE[aspectRatio] ?? "1024x1024";
  const quality = RESOLUTION_TO_OPENAI_QUALITY[resolution] ?? "medium";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const res = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        prompt,
        n: 1,
        size,
        quality,
        output_format: "png",
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI returned no image data");
    }

    return { imageData: b64, mimeType: "image/png" };
  } finally {
    clearTimeout(timeout);
  }
}

export async function editWithOpenAI(
  prompt: string,
  imageBase64: string,
  imageMimeType: string,
): Promise<OpenAIImageResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), OPENAI_TIMEOUT_MS);

  try {
    const imageBuffer = Buffer.from(imageBase64, "base64");
    const ext = imageMimeType.split("/")[1] || "png";
    const imageBlob = new Blob([imageBuffer], { type: imageMimeType });

    const formData = new FormData();
    formData.append("model", OPENAI_MODEL);
    formData.append("prompt", prompt);
    formData.append("image[]", imageBlob, `input.${ext}`);
    formData.append("output_format", "png");

    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`OpenAI edit API error ${res.status}: ${body}`);
    }

    const json = await res.json();
    const b64 = json.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI returned no image data");
    }

    return { imageData: b64, mimeType: "image/png" };
  } finally {
    clearTimeout(timeout);
  }
}
