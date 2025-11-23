import { GoogleGenAI } from "@google/genai";
import { JobResult, BusinessIdea } from "../types";

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const searchJobsWithGemini = async (keyword: string, region: string, province: string, city: string): Promise<JobResult[]> => {
  const ai = getClient();
  const location = [city, province, region, "Italia"].filter(Boolean).join(", ");
  
  const prompt = `Trova 5 offerte di lavoro reali e recenti per "${keyword}" a ${location}. 
  Per ogni lavoro, fornisci: Titolo, Azienda, Breve Descrizione (max 20 parole).
  Usa i risultati di ricerca di Google per trovare link reali.
  Rispondi con un array JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const text = response.text || "[]";
    
    // Note: Since we can't use responseSchema with googleSearch easily while maintaining groundingChunks link association logic in a simple prompt without complex parsing,
    // we will ask for JSON but parse manually and try to associate sources.
    // However, to keep it robust for this demo, we will rely on the model returning a JSON-like structure in text.
    
    // Let's refine the strategy: Ask for a structured text and parse it, or try to rely on JSON.
    // The safest way with Search Grounding is to let it write text and we display the grounding sources separately, 
    // OR try to parse the JSON if the model complies. 
    
    // Let's try to parse the JSON from the text response.
    let jobs: any[] = [];
    try {
        const cleanJson = text.replace(/```json|```/g, '').trim();
        jobs = JSON.parse(cleanJson);
        if (!Array.isArray(jobs)) jobs = [];
    } catch (e) {
        console.warn("Could not parse JSON job list", e);
        // Fallback or empty
    }

    // Map grounding chunks to jobs roughly (simplified for demo)
    return jobs.map((job: any, index: number) => ({
      id: `job-${index}-${Date.now()}`,
      title: job.Titolo || job.title || "Posizione Aperta",
      company: job.Azienda || job.company || "Azienda Confidenziale",
      location: location,
      description: job.Descrizione || job.description || "Dettagli non disponibili.",
      sources: groundingChunks.flatMap(c => c.web ? [{uri: c.web.uri, title: c.web.title}] : [])
    }));
  } catch (error) {
    console.error("Error searching jobs:", error);
    return [];
  }
};

export const generateBusinessPlan = async (ideaDescription: string): Promise<Partial<BusinessIdea>> => {
  const ai = getClient();
  const prompt = `Agisci come un consulente aziendale esperto in Italia. 
  Analizza questa idea di lavoro autonomo: "${ideaDescription}".
  
  Genera un output JSON con i seguenti campi:
  - title: Un nome accattivante per il progetto.
  - budget: Stima del budget totale necessario (es. €20.000).
  - expenses: Una lista di stringhe con le voci di spesa principali.
  - sponsors: Una lista di oggetti {name, url} di potenziali finanziatori, bandi, o incubatori in Italia reali trovati tramite ricerca.
  
  Usa Google Search per trovare bandi e finanziamenti REALI e ATTIVI.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "{}";
    const cleanJson = text.replace(/```json|```/g, '').trim();
    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error generating business plan:", error);
    throw error;
  }
};