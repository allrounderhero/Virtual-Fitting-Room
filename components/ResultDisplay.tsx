import React, { useState } from 'react';
import { AppStatus, GenerationResult, Recommendation } from '../types';
import { Download, RefreshCw, AlertCircle, Sparkles, Tag, ArrowRight, Loader2, Share2, Star, ShoppingBag, Shirt } from 'lucide-react';

interface ResultDisplayProps {
  status: AppStatus;
  result: GenerationResult | null;
  error: string | null;
  onReset: () => void;
  onApplyRecommendation: (rec: Recommendation) => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ status, result, error, onReset, onApplyRecommendation }) => {
  const [loadingRecIndex, setLoadingRecIndex] = useState<number | null>(null);

  const handleRecClick = (rec: Recommendation, index: number) => {
    setLoadingRecIndex(index);
    onApplyRecommendation(rec);
  };

  // IDLE STATE
  if (status === AppStatus.IDLE) {
    return (
      <div className="h-full w-full bg-white/5 border border-slate-800 flex flex-col items-center justify-center p-12 text-center relative overflow-hidden group">
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cubes.png")' }}></div>
        
        <div className="relative z-10 max-w-md mx-auto space-y-6">
           <div className="w-24 h-32 mx-auto border border-slate-700 rounded-sm flex items-center justify-center relative bg-white/5 shadow-2xl transform group-hover:-translate-y-2 transition-transform duration-500">
             <Shirt size={32} className="text-slate-600 group-hover:text-slate-400 transition-colors" strokeWidth={1} />
             {/* Decorative lines to look like a frame */}
             <div className="absolute -top-2 -right-2 w-6 h-6 border-t border-r border-slate-600 group-hover:border-slate-400 transition-colors"></div>
             <div className="absolute -bottom-2 -left-2 w-6 h-6 border-b border-l border-slate-600 group-hover:border-slate-400 transition-colors"></div>
           </div>
           
           <div>
             <h3 className="text-3xl font-serif font-medium text-white mb-3">Your Style Canvas</h3>
             <p className="text-slate-500 font-light text-sm leading-relaxed tracking-wide">
               Waiting for your input. Upload a model and a garment to begin the transformation.
             </p>
           </div>
        </div>
      </div>
    );
  }

  // PROCESSING STATE
  if (status === AppStatus.PROCESSING) {
    return (
      <div className="h-full w-full bg-black border border-slate-800 flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-20 h-20 mb-10">
            <div className="absolute inset-0 border border-slate-800 rounded-full animate-ping opacity-20"></div>
            <div className="absolute inset-0 border-t-2 border-white rounded-full animate-spin"></div>
          </div>
          
          <h3 className="text-xl font-serif text-white tracking-wide animate-pulse">Designing...</h3>
          <p className="text-xs text-slate-500 mt-3 font-mono uppercase tracking-widest">Rendering Physics & Light</p>
        </div>
      </div>
    );
  }

  // ERROR STATE
  if (status === AppStatus.ERROR) {
    return (
      <div className="h-full w-full bg-black border border-red-900/30 flex flex-col items-center justify-center p-10 text-center">
        <div className="bg-red-900/20 p-6 rounded-full mb-6 border border-red-900/50">
          <AlertCircle size={32} className="text-red-500" strokeWidth={1.5} />
        </div>
        <h3 className="text-lg font-serif text-white mb-2">Generation Interrupted</h3>
        <p className="text-slate-500 mb-8 max-w-sm text-sm font-light">{error || "We encountered an issue. Please check your inputs."}</p>
        <button 
          onClick={onReset}
          className="px-8 py-3 bg-white text-black hover:bg-slate-200 transition-colors text-xs font-bold uppercase tracking-widest"
        >
          Reset
        </button>
      </div>
    );
  }

  // SUCCESS STATE
  return (
    <div className="flex flex-col gap-12 pb-12">
      
      {/* Main Result */}
      <div className="relative bg-black min-h-[600px] flex items-center justify-center border border-slate-800 shadow-2xl shadow-black p-4">
          <div className="absolute inset-0 bg-white/5"></div>
          
          {result?.imageUrl && (
            <img 
              src={result.imageUrl} 
              alt="Generated Look" 
              className="max-h-[700px] w-full object-contain relative z-10"
            />
          )}

          {/* Action Toolbar */}
          <div className="absolute top-6 right-6 flex flex-col gap-3 z-20">
             <a 
              href={result?.imageUrl} 
              download="style-swap-look.png"
              className="bg-black/80 p-3 text-white hover:bg-white hover:text-black border border-slate-700 transition-all duration-300 shadow-sm backdrop-blur-md"
              title="Download"
            >
              <Download size={18} />
            </a>
            <button className="bg-black/80 p-3 text-white hover:bg-white hover:text-black border border-slate-700 transition-all duration-300 shadow-sm backdrop-blur-md">
               <Share2 size={18} />
             </button>
          </div>
          
          {/* Watermark/Label */}
          <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur px-4 py-2 border border-slate-700 text-[10px] font-bold uppercase tracking-widest text-white">
             StyleSwap AI Collection
          </div>
      </div>

      {/* Analysis & Recommendations */}
      <div className="space-y-8 px-2">
        
        {/* Stylist Notes */}
        {result?.feedback && (
          <div className="border-l-2 border-white pl-6 py-2">
             <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">AI Stylist Notes</h4>
             <p className="text-slate-300 font-serif text-xl italic leading-relaxed">"{result.feedback}"</p>
          </div>
        )}

        {/* Recommendations */}
        {result?.recommendations && result.recommendations.length > 0 && (
          <div className="pt-8 border-t border-slate-800">
            <div className="flex items-center justify-between mb-8">
               <h4 className="text-2xl font-serif text-white">Complete the Look</h4>
               <span className="text-xs text-slate-500 font-mono">BASED ON YOUR OUTFIT</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {result.recommendations.map((rec, index) => (
                <div 
                  key={index} 
                  className="group cursor-pointer"
                  onClick={() => handleRecClick(rec, index)}
                >
                  <div className="relative aspect-[3/4] bg-slate-900 mb-4 overflow-hidden border border-slate-800">
                    <div className="absolute inset-0 bg-white/5 group-hover:bg-white/10 transition-colors"></div>
                    {/* Placeholder visual for the item based on color */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div 
                          className="w-24 h-24 rounded-full opacity-20 blur-2xl transform group-hover:scale-125 transition-transform duration-700" 
                          style={{ backgroundColor: rec.colorHex }} 
                        />
                         {loadingRecIndex === index ? (
                           <Loader2 className="animate-spin text-slate-500" />
                         ) : (
                           <div 
                            className="w-8 h-8 rounded-full shadow-sm border border-black/50"
                            style={{ backgroundColor: rec.colorHex }}
                           />
                         )}
                    </div>
                    
                    <div className="absolute bottom-0 left-0 w-full bg-black/90 backdrop-blur py-2 text-center translate-y-full group-hover:translate-y-0 transition-transform duration-300 border-t border-slate-800">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-white">Try On</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{rec.category}</p>
                    <h5 className="font-medium text-white text-sm leading-tight group-hover:text-slate-300 transition-colors">
                      {rec.itemName}
                    </h5>
                    <p className="text-xs text-slate-500 font-light line-clamp-2 mt-2 leading-relaxed">
                      {rec.reason}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-center pt-12">
          <button 
            onClick={onReset}
            className="px-8 py-3 text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Start New Session
          </button>
        </div>
      </div>
    </div>
  );
};