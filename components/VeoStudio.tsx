import React, { useState, useRef } from 'react';
import { generateVideo } from '../services/veo';

const VeoStudio: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [loading, setLoading] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const checkApiKey = async () => {
     if (window.aistudio && window.aistudio.hasSelectedApiKey) {
         const hasKey = await window.aistudio.hasSelectedApiKey();
         if (!hasKey) {
             const success = await window.aistudio.openSelectKey();
             return success;
         }
         return true;
     }
     return true; // Fallback for dev envs without aistudio wrapper if env var works
  };

  const handleGenerate = async () => {
    if (!file) return;
    
    setLoading(true);
    setVideoUrl(null);
    try {
      const keyReady = await checkApiKey();
      if (!keyReady) {
          alert("È necessario selezionare una API Key pagata per usare Veo.");
          setLoading(false);
          return;
      }

      const url = await generateVideo(file, prompt, aspectRatio);
      setVideoUrl(url);
    } catch (error) {
      console.error(error);
      alert("Errore nella generazione del video. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-2xl text-white shadow-lg mb-6">
            <h2 className="text-2xl font-bold mb-2">Veo Studio</h2>
            <p className="opacity-90 text-sm">Anima le tue foto con l'intelligenza artificiale generativa.</p>
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs underline mt-2 block opacity-75">Richiede progetto con fatturazione</a>
        </div>

        <div className="space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">1. Carica Foto</label>
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-50 transition-colors"
                >
                    {file ? (
                        <div className="text-center">
                            <span className="text-green-600 font-medium">Foto caricata!</span>
                            <p className="text-xs text-slate-400 mt-1">{file.name}</p>
                        </div>
                    ) : (
                        <div className="text-center text-slate-400">
                            <span className="text-2xl block mb-1">+</span>
                            <span className="text-sm">Tocca per caricare</span>
                        </div>
                    )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">2. Descrivi l'animazione</label>
                <input 
                    type="text" 
                    placeholder="Es. Il gatto si mette a ballare..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-purple-500 outline-none"
                />
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <label className="block text-sm font-medium text-slate-700 mb-2">3. Formato</label>
                <div className="flex gap-4">
                    <button 
                        onClick={() => setAspectRatio('16:9')}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium ${aspectRatio === '16:9' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-slate-200 text-slate-600'}`}
                    >
                        Orizzontale (16:9)
                    </button>
                    <button 
                        onClick={() => setAspectRatio('9:16')}
                        className={`flex-1 py-2 rounded-lg border text-sm font-medium ${aspectRatio === '9:16' ? 'bg-purple-50 border-purple-500 text-purple-700' : 'border-slate-200 text-slate-600'}`}
                    >
                        Verticale (9:16)
                    </button>
                </div>
            </div>

            <button 
                onClick={handleGenerate}
                disabled={loading || !file}
                className="w-full bg-purple-600 text-white font-bold py-4 rounded-xl shadow-lg hover:bg-purple-700 transition-all disabled:opacity-50 disabled:shadow-none"
            >
                {loading ? 'Generazione Video in corso...' : 'Genera Video con Veo'}
            </button>
        </div>

        {videoUrl && (
            <div className="fixed inset-0 bg-black/90 z-50 flex flex-col items-center justify-center p-4">
                <button onClick={() => setVideoUrl(null)} className="absolute top-4 right-4 text-white text-xl p-2">✕</button>
                <video src={videoUrl} controls autoPlay loop className="max-w-full max-h-[80vh] rounded-lg shadow-2xl" />
                <a href={videoUrl} download="veo_generation.mp4" className="mt-4 bg-white text-black px-6 py-2 rounded-full font-bold">Scarica Video</a>
            </div>
        )}
    </div>
  );
};

export default VeoStudio;