import React, { useState } from 'react';
import { generateBusinessPlan } from '../services/gemini';
import { BusinessIdea } from '../types';
import { MOCK_IDEAS } from '../constants';

const IdeaSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'generate' | 'community'>('generate');
  const [prompt, setPrompt] = useState('');
  const [generatedIdea, setGeneratedIdea] = useState<Partial<BusinessIdea> | null>(null);
  const [loading, setLoading] = useState(false);
  const [communityIdeas, setCommunityIdeas] = useState<BusinessIdea[]>(MOCK_IDEAS);

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    try {
        const plan = await generateBusinessPlan(prompt);
        setGeneratedIdea(plan);
    } catch (e) {
        alert("Impossibile generare il piano. Riprova.");
    } finally {
        setLoading(false);
    }
  };

  const handleShare = () => {
    if (generatedIdea && generatedIdea.title) {
        const newIdea: BusinessIdea = {
            id: Date.now().toString(),
            title: generatedIdea.title,
            description: prompt,
            budget: generatedIdea.budget || 'N/A',
            expenses: generatedIdea.expenses || [],
            sponsors: generatedIdea.sponsors || [],
            author: 'Utente Ospite',
            createdAt: Date.now()
        };
        setCommunityIdeas([newIdea, ...communityIdeas]);
        setActiveTab('community');
        setGeneratedIdea(null);
        setPrompt('');
    }
  };

  return (
    <div className="p-4 pb-24 h-full flex flex-col">
       <div className="flex gap-2 mb-6 bg-slate-200 p-1 rounded-lg">
         <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'generate' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('generate')}
         >
            Genera Idea
         </button>
         <button 
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'community' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}
            onClick={() => setActiveTab('community')}
         >
            Community
         </button>
       </div>

       {activeTab === 'generate' && (
         <div className="space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Nuova Impresa</h2>
                <p className="text-slate-500 text-sm mb-4">Descrivi la tua idea. L'IA calcolerà budget, spese e troverà finanziatori.</p>
                <textarea 
                    className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none resize-none h-32"
                    placeholder="Es. Voglio aprire un servizio di catering vegano a Milano..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                />
                <button 
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full mt-4 bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                >
                    {loading ? 'Analisi in corso...' : 'Calcola Business Plan'}
                </button>
            </div>

            {generatedIdea && (
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-indigo-100 animate-fade-in">
                    <h3 className="text-2xl font-bold text-indigo-900 mb-4">{generatedIdea.title}</h3>
                    
                    <div className="space-y-4">
                        <div className="bg-indigo-50 p-4 rounded-xl">
                            <span className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">Budget Stimato</span>
                            <span className="text-2xl font-bold text-indigo-700">{generatedIdea.budget}</span>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Spese Previste</h4>
                            <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                                {generatedIdea.expenses?.map((ex, i) => <li key={i}>{ex}</li>)}
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-semibold text-slate-800 mb-2">Sponsor & Finanziamenti</h4>
                            <div className="grid gap-2">
                                {generatedIdea.sponsors?.map((sp, i) => (
                                    <a key={i} href={sp.url} target="_blank" rel="noreferrer" className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-indigo-300 group">
                                        <span className="text-sm font-medium text-slate-700">{sp.name}</span>
                                        <span className="text-indigo-500 opacity-0 group-hover:opacity-100">↗</span>
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={handleShare}
                        className="w-full mt-6 py-3 border-2 border-indigo-600 text-indigo-600 font-bold rounded-xl hover:bg-indigo-50 transition-colors"
                    >
                        Condividi con la Community
                    </button>
                </div>
            )}
         </div>
       )}

       {activeTab === 'community' && (
         <div className="space-y-4 overflow-y-auto">
            {communityIdeas.map((idea) => (
                <div key={idea.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-lg text-slate-900">{idea.title}</h3>
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{idea.budget}</span>
                    </div>
                    <p className="text-slate-600 text-sm mb-4">{idea.description}</p>
                    <div className="text-xs text-slate-400 flex justify-between items-center">
                        <span>Autore: {idea.author}</span>
                        <span>{new Date(idea.createdAt).toLocaleDateString()}</span>
                    </div>
                </div>
            ))}
         </div>
       )}
    </div>
  );
};

export default IdeaSection;