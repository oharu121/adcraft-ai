/**
 * Gemini AI Studio Client
 *
 * Handles API calls to Gemini AI Studio using API key authentication.
 * Supports both text-only and vision (text + image) generation.
 */

/**
 * API response interface
 */
export interface GeminiAPIResponse {
  text: string;
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Image generation response interface
 */
export interface GeminiImageResponse {
  images: string[]; // Base64 encoded images
  usage: { input_tokens: number; output_tokens: number };
}

/**
 * Gemini AI Studio Client class
 */
export class GeminiAIStudioClient {
  private readonly apiKey: string;
  private readonly baseUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";
  private readonly imageGenUrl =
    "https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Generate content with text and image input
   */
  public async generateWithVision(prompt: string, imageData: string): Promise<GeminiAPIResponse> {
    const mimeType = this.detectMimeTypeFromBase64(imageData);

    const request = {
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: imageData,
              },
            },
          ],
        },
      ],
      generation_config: {
        temperature: 0.3,
        top_p: 0.8,
        top_k: 40,
        max_output_tokens: 4096,
      },
    };

    console.log("[GEMINI AI STUDIO] Using vision API with API key");

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini AI Studio API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.candidates || !result.candidates[0] || !result.candidates[0].content) {
      throw new Error("Invalid response format from Gemini AI Studio API");
    }

    return {
      text: result.candidates[0].content.parts[0].text,
      usage: result.usage_metadata || { input_tokens: 1000, output_tokens: 2000 },
    };
  }

  /**
   * Generate content with text-only input
   */
  public async generateTextOnly(prompt: string): Promise<GeminiAPIResponse> {
    const request = {
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
      },
    };

    console.log("[GEMINI AI STUDIO] Using text-only API with API key");

    const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini AI Studio API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      throw new Error("No content received from Gemini AI Studio API");
    }

    return {
      text: textContent,
      usage: {
        input_tokens: data.usageMetadata?.promptTokenCount || 0,
        output_tokens: data.usageMetadata?.candidatesTokenCount || 0,
      },
    };
  }

  /**
   * Detect MIME type from base64 image data
   */
  private detectMimeTypeFromBase64(base64Data: string): string {
    // Check for data URL prefix and extract MIME type
    if (base64Data.startsWith("data:")) {
      const mimeMatch = base64Data.match(/^data:([^;]+);base64,/);
      if (mimeMatch) {
        return mimeMatch[1];
      }
    }

    // Check first few bytes for common image formats
    const firstBytes = base64Data.slice(0, 20);

    // Convert base64 to check magic bytes
    try {
      const decoded = atob(firstBytes);
      const bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) {
        bytes[i] = decoded.charCodeAt(i);
      }

      // JPEG magic bytes: FF D8 FF
      if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
        return "image/jpeg";
      }

      // PNG magic bytes: 89 50 4E 47
      if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
        return "image/png";
      }

      // WebP magic bytes: 52 49 46 46 (RIFF)
      if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
        return "image/webp";
      }

      // GIF magic bytes: 47 49 46 38
      if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) {
        return "image/gif";
      }
    } catch (error) {
      console.warn("Failed to detect image format from base64:", error);
    }

    // Default fallback
    return "image/jpeg";
  }

  /**
   * Generate images using Imagen 4.0 (more reliable than Gemini Flash)
   */
  public async generateImages(prompt: string, count: number = 4): Promise<GeminiImageResponse> {
    console.log(`[GEMINI AI STUDIO] Generating ${count} images using Imagen 4.0`);
    console.log(`[GEMINI AI STUDIO] API Key present: ${!!this.apiKey && this.apiKey.length > 0}`);

    // Imagen supports generating multiple images in a single request!
    const request = {
      instances: [
        {
          prompt: prompt,
        },
      ],
      parameters: {
        sampleCount: count,
        sampleImageSize: "1k", // 512x512 - lighter for Veo processing
        aspectRatio: "1:1", // Square format good for products
      },
    };

    console.log(`[GEMINI AI STUDIO] Imagen request:`, JSON.stringify(request, null, 2));

    const response = await fetch(this.imageGenUrl, {
      method: "POST",
      headers: {
        "x-goog-api-key": this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[GEMINI AI STUDIO] Imagen API error: ${response.status} - ${errorText}`);
      throw new Error(`Imagen API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log(`[GEMINI AI STUDIO] Imagen response structure:`, Object.keys(result));

    const images: string[] = [];

    // Extract images from Imagen response format
    if (result.predictions && Array.isArray(result.predictions)) {
      for (const prediction of result.predictions) {
        if (prediction.bytesBase64Encoded) {
          images.push(prediction.bytesBase64Encoded);
          console.log(`[GEMINI AI STUDIO] Successfully extracted image ${images.length}/${count}`);
        }
      }
    }

    if (images.length === 0) {
      console.error(`[GEMINI AI STUDIO] No images found in response:`, result);
      throw new Error("No images were successfully generated by Imagen 4.0");
    }

    console.log(
      `[GEMINI AI STUDIO] Successfully generated ${images.length}/${count} images using Imagen`
    );

    return {
      images,
      usage: { input_tokens: 400 * count, output_tokens: 100 * count }, // Estimated usage
    };
  }
}
