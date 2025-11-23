import React, { useState } from 'react';
import { ITALIAN_REGIONS } from '../constants';
import { searchJobsWithGemini } from '../services/gemini';
import { JobResult, JobSearchFilters } from '../types';

const JobSection: React.FC = () => {
  const [filters, setFilters] = useState<JobSearchFilters>({
    keyword: '',
    region: '',
    province: '',
    city: ''
  });
  const [jobs, setJobs] = useState<JobResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!filters.keyword) return;
    
    setLoading(true);
    setJobs([]);
    try {
      const results = await searchJobsWithGemini(
        filters.keyword,
        filters.region,
        filters.province,
        filters.city
      );
      setJobs(results);
    } catch (err) {
      alert("Errore durante la ricerca.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Trova Lavoro</h2>
        <form onSubmit={handleSearch} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cosa cerchi?</label>
            <input 
              type="text" 
              placeholder="Es. Sviluppatore, Barista, Idraulico"
              className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              value={filters.keyword}
              onChange={(e) => setFilters({...filters, keyword: e.target.value})}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Regione</label>
                <select 
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    value={filters.region}
                    onChange={(e) => setFilters({...filters, region: e.target.value})}
                >
                    <option value="">Tutte</option>
                    {ITALIAN_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
             </div>
             <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Provincia</label>
                <input 
                  type="text" 
                  placeholder="Sigla (es. MI)"
                  className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={filters.province}
                  onChange={(e) => setFilters({...filters, province: e.target.value})}
                />
             </div>
          </div>
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Città (Opzionale)</label>
             <input 
               type="text" 
               placeholder="Es. Roma"
               className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
               value={filters.city}
               onChange={(e) => setFilters({...filters, city: e.target.value})}
             />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Ricerca in corso...' : 'Cerca Offerte'}
          </button>
        </form>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <h3 className="font-bold text-lg text-slate-900">{job.title}</h3>
            <p className="text-slate-600 text-sm mb-2">{job.company} • {job.location}</p>
            <p className="text-slate-500 text-sm mb-3">{job.description}</p>
            
            {job.sources && job.sources.length > 0 && (
                <div className="mt-3 pt-3 border-t border-slate-50">
                    <p className="text-xs text-slate-400 mb-1">Fonti trovate:</p>
                    <div className="flex flex-wrap gap-2">
                        {job.sources.slice(0, 3).map((src, idx) => (
                            <a 
                                key={idx} 
                                href={src.uri} 
                                target="_blank" 
                                rel="noreferrer"
                                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:underline truncate max-w-[150px]"
                            >
                                {src.title || "Link"}
                            </a>
                        ))}
                    </div>
                </div>
            )}
          </div>
        ))}
        {!loading && jobs.length === 0 && filters.keyword && (
            <p className="text-center text-slate-400 mt-8">Nessun risultato trovato. Prova a modificare i filtri.</p>
        )}
      </div>
    </div>
  );
};

export default JobSection;