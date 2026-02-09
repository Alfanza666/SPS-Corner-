
import { GoogleGenAI, Type } from "@google/genai";

// Helper for safe env access (duplicated to avoid circular dependencies/complex imports in this simple setup)
const getApiKey = (): string => {
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) return process.env.API_KEY;
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.API_KEY || import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}
  return '';
};

// Lazy initialization to prevent top-level crashes
let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  if (!aiInstance) {
    const apiKey = getApiKey();
    // Using a fallback dummy key to allow instantiation; actual calls will fail gracefully if key is invalid
    aiInstance = new GoogleGenAI({ apiKey: apiKey || 'dummy_key' });
  }
  return aiInstance;
}

export interface ValidationResult {
  isValid: boolean;
  merchantNameFound: boolean;
  amountMatch: boolean;
  dateFound: boolean;
  senderNameMatch?: boolean;
  confidenceScore: number; // 0-100
  reason: string;
}

export const validatePaymentProof = async (
  base64Image: string,
  expectedAmount: number,
  buyerName?: string
): Promise<ValidationResult> => {
  const apiKey = getApiKey();
  
  // Check Key availability before calling API
  if (!apiKey || apiKey === 'dummy_key_to_prevent_crash') {
    console.error("Gemini API Key is missing.");
    return {
      isValid: false,
      merchantNameFound: false,
      amountMatch: false,
      dateFound: false,
      confidenceScore: 0,
      reason: "Sistem Error: API Key AI belum dikonfigurasi. Hubungi Admin."
    };
  }

  try {
    const ai = getAiClient();
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg);base64,/, "");

    const prompt = `
      You are an automated receipt scanner assistant for a digital kiosk.
      Analyze the provided image of a payment receipt/transfer proof.
      
      Expected Transaction Details:
      - Target Amount: Rp ${expectedAmount.toLocaleString('id-ID')}
      - Payer Name: "${buyerName || 'Any'}"
      
      Instructions:
      1. Extract the transaction amount. Does it match ${expectedAmount}?
      2. Find the date and time of the transaction.
      3. Look for the sender's name and check if it relates to "${buyerName}".
      4. Verify if this looks like a valid bank transfer or QRIS success screen.
    `;

    // Use responseSchema for robust JSON output as per @google/genai guidelines
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: {
              type: Type.BOOLEAN,
              description: 'True if the receipt is a valid proof of payment for the correct amount.',
            },
            merchantNameFound: {
              type: Type.BOOLEAN,
              description: 'Whether the merchant or destination bank/entity was found.',
            },
            amountMatch: {
              type: Type.BOOLEAN,
              description: 'Whether the numerical amount in the receipt matches the expected target amount.',
            },
            dateFound: {
              type: Type.BOOLEAN,
              description: 'Whether a transaction date and time were identified.',
            },
            senderNameMatch: {
              type: Type.BOOLEAN,
              description: 'Whether the sender/payer name matches the provided user name.',
            },
            confidenceScore: {
              type: Type.NUMBER,
              description: 'Level of confidence in the validation, from 0 to 100.',
            },
            reason: {
              type: Type.STRING,
              description: 'Detailed explanation in Indonesian regarding the validation status.',
            }
          },
          required: ["isValid", "merchantNameFound", "amountMatch", "dateFound", "confidenceScore", "reason"],
        }
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Invalid response format from AI");
    }
    
    return JSON.parse(responseText.trim()) as ValidationResult;

  } catch (error) {
    console.error("Gemini Validation Error:", error);
    return {
      isValid: false,
      merchantNameFound: false,
      amountMatch: false,
      dateFound: false,
      senderNameMatch: false,
      confidenceScore: 0,
      reason: "Gagal memproses gambar. Pastikan foto bukti bayar terlihat jelas dan terang."
    };
  }
};
