import { GoogleGenAI, Type } from "@google/genai";
import { GenerationResult, Recommendation, Pose } from "../types";

// Helper to extract the mime type and base64 data from a Data URL
const parseBase64 = (dataUrl: string) => {
  const matches = dataUrl.match(/^data:(.+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    throw new Error("Invalid base64 string provided.");
  }
  return { mimeType: matches[1], data: matches[2] };
};

export const validateClothingSafety = async (
  clothingImageBase64: string
): Promise<{ valid: boolean; reason?: string }> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const clothingImage = parseBase64(clothingImageBase64);

  const prompt = `
    Analyze this image strictly for an e-commerce virtual try-on application.
    
    Security & Policy Check:
    1. Is this image a piece of clothing or a fashion accessory?
    2. Is the content SAFE and APPROPRIATE for a general audience?
    3. STRICTLY PROHIBITED: Lingerie, Underwear, Swimwear, Bikinis, Hate Symbols, Nudity, or Realistic Weapons.
    
    Return JSON with:
    - valid (boolean): true if safe and is clothing. false otherwise.
    - reason (string): Short explanation if invalid.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: clothingImage },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            valid: { type: Type.BOOLEAN },
            reason: { type: Type.STRING }
          }
        },
        // Use thinking to handle edge cases (e.g. activewear vs lingerie)
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      return result;
    }
    
    // Default fallback if JSON parsing fails but no error thrown
    return { valid: false, reason: "Unable to verify image safety." };

  } catch (error: any) {
    console.error("Safety Check Error:", error);
    // Fail safe: if we can't check, we don't allow it.
    throw new Error("Security validation service is currently unavailable.");
  }
};

export const generateStylistReview = async (
  userImageBase64: string,
  clothingImageBase64: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const userImage = parseBase64(userImageBase64);
  const clothingImage = parseBase64(clothingImageBase64);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: userImage },
          { inlineData: clothingImage },
          { text: "Act as a professional fashion stylist. Analyze how this garment would look on the person. Think step-by-step about the fit, color theory, and style compatibility. Provide a 1-2 sentence positive, sophisticated comment on the final look. Do not describe the technical generation process." }
        ]
      },
      config: {
        // Use thinking for high-quality, reasoned fashion advice
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    return response.text || "A sophisticated choice that complements your style perfectly.";
  } catch (error) {
    console.warn("Stylist review failed", error);
    return "This look is bold and stylish!";
  }
};

export const generateTryOn = async (
  userImageBase64: string,
  clothingImageBase64: string,
  instructions: string,
  pose: Pose = 'original'
): Promise<{ imageUrl: string }> => {
  // Initialize the Gemini API client
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const userImage = parseBase64(userImageBase64);
  const clothingImage = parseBase64(clothingImageBase64);

  // Construct a direct prompt for the model to ensure image generation
  const prompt = `
    Generate a photorealistic image of the person in the first image wearing the garment in the second image.
    
    STRICT REQUIREMENTS:
    1. Retain the exact identity, face, hair, body shape, and skin tone of the person in the first image.
    2. Retain the background and lighting of the first image exactly.
    3. Replace the person's original clothing with the garment from the second image. The fit should be natural and realistic.
    ${pose !== 'original' ? `4. ATTENTION: Rotate the person to a ${pose} degree view.` : '4. Maintain the exact original pose.'}
    ${instructions ? `5. Additional Instructions: ${instructions}` : ''}
    
    OUTPUT:
    - Return ONLY the generated image.
    - DO NOT return JSON, XML, or conversational text.
    - DO NOT describe the task.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: userImage },
          { inlineData: clothingImage },
          { text: prompt }
        ]
      },
      // Note: responseMimeType/thinkingConfig are not supported for gemini-2.5-flash-image output
    });

    let imageUrl: string | undefined;

    // Parse the response parts to find the image
    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      }
    }

    if (!imageUrl) {
      // Check for textual refusal or error
      const textPart = parts.find(p => p.text)?.text;
      if (textPart) {
        console.warn("Model returned text but no image:", textPart);
        const cleanFeedback = textPart.replace(/```json[\s\S]*?```/g, "").trim();
        if (cleanFeedback.length > 0) {
           throw new Error(`The model could not generate the image. Message: "${cleanFeedback.substring(0, 100)}..."`);
        }
      }
      throw new Error("The model did not return an image. Please try a different photo or clothing item.");
    }

    return { imageUrl };

  } catch (error: any) {
    console.error("Gemini Try-On Error:", error);
    throw new Error(error.message || "Failed to process virtual try-on.");
  }
};

export const generateStyleRecommendations = async (
  clothingImageBase64: string
): Promise<Recommendation[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const clothingImage = parseBase64(clothingImageBase64);

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: clothingImage },
          { text: "Analyze this clothing item. Think about fashion trends and color coordination to suggest 3 matching items (e.g., shoes, accessories, bottoms) to complete the outfit. Provide the 'colorHex' for each item to visually represent it. Return the result as a JSON array." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              category: { type: Type.STRING },
              reason: { type: Type.STRING },
              colorHex: { type: Type.STRING, description: "A hex color code representing the suggested item." }
            }
          }
        },
        // Use thinking to improve the quality of recommendations
        thinkingConfig: { thinkingBudget: 1024 }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Recommendation[];
    }
    
    return [];

  } catch (error) {
    console.error("Gemini Recommendation Error:", error);
    // Return empty array on failure rather than blocking the UI
    return [];
  }
};

export const generateProductImage = async (
  recommendation: Recommendation
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Generate a professional e-commerce product image of: ${recommendation.colorHex} ${recommendation.itemName} (${recommendation.category}).
    Style: Isolated on a pure white background, studio lighting, high resolution, realistic texture.
    View: Front facing, clear details.
    
    OUTPUT:
    - Return ONLY the generated image.
    - DO NOT return text.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
    });

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    // If text is returned instead
    const textPart = parts.find(p => p.text)?.text;
    if (textPart) {
        console.warn("Product gen returned text:", textPart);
        const cleanText = textPart.replace(/```[\s\S]*?```/g, "").trim();
        throw new Error(`Model returned text: ${cleanText.substring(0, 50)}...`);
    }

    throw new Error("No image generated");
  } catch (error: any) {
    console.error("Product Generation Error:", error);
    throw new Error("Failed to visualize the recommended item.");
  }
};