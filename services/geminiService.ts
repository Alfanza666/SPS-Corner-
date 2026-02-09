import { GoogleGenAI, Type } from "@google/genai";

// Helper untuk mengambil API Key dengan aman
const getApiKey = (): string => {
  // Cek process.env.API_KEY (dari define vite.config)
  if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
    return process.env.API_KEY;
  }
  // Cek VITE_GOOGLE_API_KEY standard
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_GOOGLE_API_KEY) {
    return import.meta.env.VITE_GOOGLE_API_KEY;
  }
  return '';
};

let aiInstance: GoogleGenAI | null = null;

const getAiClient = () => {
  const apiKey = getApiKey();

  if (!apiKey) {
    // Jangan console.error di sini agar tidak spam log saat app load
    return null;
  }
  
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: apiKey });
  }
  return aiInstance;
}

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
  
  const ai = getAiClient();

  if (!ai) {
    console.error("API Key Missing");
    throw new Error("Google API Key belum dikonfigurasi. Pastikan Variable Environment VITE_GOOGLE_API_KEY atau API_KEY sudah diset di Vercel.");
  }

  try {
    // Clean base64 string
    const cleanBase64 = base64Image.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, "");

    const promptText = `
      Anda adalah auditor keuangan. Analisis bukti transfer/pembayaran ini.
      
      Data yang diharapkan:
      - Nominal: Rp ${expectedAmount}
      - Nama Pengirim (Opsional): ${buyerName || 'Tidak spesifik'}
      - Tanggal: Hari ini
      
      Instruksi:
      1. Cari nominal pembayaran. Apakah cocok dengan ${expectedAmount}?
      2. Cek apakah ini struk yang valid/asli dan bukan editan kasar.
      3. Berikan alasan validasi dalam bahasa Indonesia.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-latest',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: promptText }
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
            reason: { type: Type.STRING }
          }
        }
      }
    });

    const responseText = response.text;
    if (!responseText) throw new Error("AI tidak memberikan respon.");
    
    return JSON.parse(responseText.trim()) as ValidationResult;

  } catch (error: any) {
    console.error("Gemini AI Error:", error);
    
    let reason = "Gagal menghubungi layanan AI.";
    if (error.message?.includes("API_KEY")) reason = "API Key Salah/Hilang.";
    if (error.message?.includes("429")) reason = "Terlalu banyak request (Quota Exceeded).";
    
    return {
      isValid: false,
      merchantNameFound: false,
      amountMatch: false,
      dateFound: false,
      confidenceScore: 0,
      reason: reason
    };
  }
};