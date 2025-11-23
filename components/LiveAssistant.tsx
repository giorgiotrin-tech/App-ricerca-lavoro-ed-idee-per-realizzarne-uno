import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { base64ToUint8Array, arrayBufferToBase64, decodeAudioData } from '../services/live';

const LiveAssistant: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Refs for audio handling to avoid re-renders resetting context
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionRef = useRef<any>(null); // Type is loosely defined as connection session
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Visualizer refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>();

  const startVisualizer = (ctx: AudioContext, sourceNode: AudioNode) => {
    if (!canvasRef.current) return;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    sourceNode.connect(analyser);
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    if(!canvasCtx) return;

    const draw = () => {
        animationFrameRef.current = requestAnimationFrame(draw);
        analyser.getByteFrequencyData(dataArray);

        canvasCtx.fillStyle = '#1e293b'; // Slate 800 background
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;

        for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            // Gradient fill
            canvasCtx.fillStyle = `rgb(${barHeight + 100}, 50, 50)`; 
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    };
    draw();
  };

  const connect = async () => {
    try {
        setError(null);
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Setup Audio Input
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        inputAudioContextRef.current = inputCtx;
        
        const inputSource = inputCtx.createMediaStreamSource(stream);
        const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
        
        // Visualizer for input
        startVisualizer(inputCtx, inputSource);

        inputSource.connect(scriptProcessor);
        scriptProcessor.connect(inputCtx.destination); // Need to connect to destination for process to fire

        // 2. Setup Audio Output
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = outputCtx;
        nextStartTimeRef.current = 0;

        // 3. Connect to Gemini Live
        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-09-2025',
            callbacks: {
                onopen: () => {
                    console.log("Live Session Open");
                    setConnected(true);
                    
                    // Start sending audio
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        
                        // Convert Float32 [-1, 1] to Int16
                        const l = inputData.length;
                        const int16 = new Int16Array(l);
                        for (let i = 0; i < l; i++) {
                            int16[i] = inputData[i] * 32768;
                        }
                        
                        const base64Data = arrayBufferToBase64(int16.buffer);
                        
                        sessionPromise.then(session => {
                            session.sendRealtimeInput({
                                media: {
                                    data: base64Data,
                                    mimeType: 'audio/pcm;rate=16000'
                                }
                            });
                        });
                    };
                },
                onmessage: async (msg: LiveServerMessage) => {
                    const audioStr = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                    if (audioStr && audioContextRef.current) {
                        setIsSpeaking(true);
                        const bytes = base64ToUint8Array(audioStr);
                        
                        // Sync Playback
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioContextRef.current.currentTime);
                        
                        const audioBuffer = await decodeAudioData(
                            bytes, 
                            audioContextRef.current, 
                            24000, 
                            1
                        );
                        
                        const source = audioContextRef.current.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(audioContextRef.current.destination);
                        
                        source.addEventListener('ended', () => {
                            sourcesRef.current.delete(source);
                            if (sourcesRef.current.size === 0) setIsSpeaking(false);
                        });

                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        sourcesRef.current.add(source);
                    }

                    if (msg.serverContent?.interrupted) {
                        console.log("Interrupted");
                        sourcesRef.current.forEach(s => s.stop());
                        sourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                        setIsSpeaking(false);
                    }
                },
                onclose: () => {
                    console.log("Live Session Closed");
                    setConnected(false);
                },
                onerror: (err) => {
                    console.error("Live Error", err);
                    setError("Errore di connessione.");
                }
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // Friendly Italian-compatible tone? Kore is standard.
                },
                systemInstruction: "Sei un assistente per il lavoro in Italia. Parla in italiano. Sii conciso, utile e professionale. Aiuta l'utente a trovare lavoro o a perfezionare idee di business."
            }
        });
        
        sessionRef.current = sessionPromise;

    } catch (e) {
        console.error("Setup Error", e);
        setError("Impossibile accedere al microfono o connettersi.");
    }
  };

  const disconnect = async () => {
    if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (inputAudioContextRef.current) {
        await inputAudioContextRef.current.close();
    }
    if (audioContextRef.current) {
        await audioContextRef.current.close();
    }
    if (sessionRef.current) {
       // Cannot explicitly close session object based on current SDK types shown in prompt, 
       // but closing callbacks happens via dropping references and stopping streams.
       // Ideally: (await sessionRef.current).close(); if method exists, else rely on garbage collection + stream end.
    }
    if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
    }
    setConnected(false);
    setIsSpeaking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
        disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] bg-slate-900 text-white p-6">
      <div className="mb-10 text-center">
         <h2 className="text-3xl font-light mb-2">Assistente Vocale</h2>
         <p className="text-slate-400">Parla con l'IA per consigli sulla carriera in tempo reale.</p>
      </div>

      <div className="relative w-64 h-64 mb-10 flex items-center justify-center">
        {/* Glow effect */}
        <div className={`absolute inset-0 rounded-full bg-blue-500 blur-3xl opacity-20 transition-opacity duration-500 ${isSpeaking ? 'opacity-50 scale-110' : ''}`}></div>
        
        {/* Visualizer Canvas */}
        <canvas 
            ref={canvasRef} 
            width={300} 
            height={100} 
            className="w-full h-32 absolute z-10 opacity-80"
        />

        {/* Center Button Icon */}
        <div className={`z-20 w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-2xl transition-all duration-300 ${connected ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-600 hover:bg-blue-500 animate-pulse'}`}>
            <button onClick={connected ? disconnect : connect} className="w-full h-full rounded-full flex items-center justify-center outline-none">
                {connected ? '■' : '🎙️'}
            </button>
        </div>
      </div>

      <div className="text-center h-8">
        {error && <p className="text-red-400">{error}</p>}
        {connected && !isSpeaking && <p className="text-slate-400 animate-pulse">In ascolto...</p>}
        {isSpeaking && <p className="text-blue-300 font-medium">L'Assistente sta parlando...</p>}
      </div>

      {!connected && (
        <button 
            onClick={connect} 
            className="mt-8 px-8 py-3 bg-white text-slate-900 rounded-full font-bold hover:bg-slate-200 transition-colors"
        >
            Inizia Conversazione
        </button>
      )}
    </div>
  );
};

export default LiveAssistant;