import { GoogleGenAI, Type } from "@google/genai";

// Initialize AI with the key from process.env (handled by vite define)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ValidationResult {
  isValid: boolean;
  merchantNameFound: boolean;
  amountMatch: boolean;
  dateFound: boolean;
  senderNameMatch?: boolean;
  confidenceScore: number;
  reason: string;
}

export const validatePaymentProof = async (
  base64Image: string,
  expectedAmount: number,
  buyerName?: string
): Promise<ValidationResult> => {
  try {
    // Clean base64 string
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const prompt = `
      Analyze this payment receipt image.
      
      Context:
      - Expected Amount: Rp ${expectedAmount}
      - Expected Payer: ${buyerName || "Unknown"}
      
      Task:
      Determine if this is a valid successful transfer receipt matching the amount.
      Check for time, date, and status 'Success' or 'Berhasil'.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest', // Using latest flash model for vision tasks
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: cleanBase64
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            merchantNameFound: { type: Type.BOOLEAN },
            amountMatch: { type: Type.BOOLEAN },
            dateFound: { type: Type.BOOLEAN },
            senderNameMatch: { type: Type.BOOLEAN },
            confidenceScore: { type: Type.NUMBER },
            reason: { type: Type.STRING },
          },
          required: ["isValid", "amountMatch", "reason"]
        }
      }
    });

    const resultText = response.text;
    if (!resultText) throw new Error("Empty response from AI");
    
    return JSON.parse(resultText) as ValidationResult;

  } catch (error) {
    console.error("Gemini AI Validation Error:", error);
    return {
      isValid: false,
      merchantNameFound: false,
      amountMatch: false,
      dateFound: false,
      senderNameMatch: false,
      confidenceScore: 0,
      reason: "Gagal menghubungkan ke AI. Silakan coba lagi atau panggil petugas."
    };
  }
};