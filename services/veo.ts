import { GoogleGenAI } from "@google/genai";

// Ensure the user selects an API key before calling this
export const generateVideo = async (
  imageFile: File, 
  prompt: string, 
  aspectRatio: '16:9' | '9:16' = '16:9'
): Promise<string | null> => {
    
  // Re-instantiate to ensure we pick up the key if selected via window.aistudio
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
        const result = reader.result as string;
        // Remove data URL prefix
        resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt || "Animate this image cinematically",
      image: {
        imageBytes: base64Data,
        mimeType: imageFile.type,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: aspectRatio
      }
    });

    // Polling loop
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // 5s poll
      operation = await ai.operations.getVideosOperation({ operation: operation });
      console.log("Veo status:", operation.metadata);
    }

    const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (videoUri) {
        // Append API Key for download
        return `${videoUri}&key=${process.env.API_KEY}`;
    }
    return null;

  } catch (error) {
    console.error("Veo generation error:", error);
    throw error;
  }
};
