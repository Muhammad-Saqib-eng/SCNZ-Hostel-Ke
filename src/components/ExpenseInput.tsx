import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, Wallet, RotateCcw, Box, Target } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExpenseInputProps {
  onAnalyze: (text: string, allowance: number) => void;
  isAnalyzing: boolean;
}

export function ExpenseInput({ onAnalyze, isAnalyzing }: ExpenseInputProps) {
  const [text, setText] = useState('');
  const [allowance, setAllowance] = useState<string>('5000');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onAnalyze(text, parseFloat(allowance));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto w-full px-4"
    >
      <div className="bg-white rounded-[48px] p-12 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.08)] border border-gray-100 relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-emerald-500 to-emerald-400" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-gray-900 text-white rounded-[24px] shadow-xl shadow-gray-900/20 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-8 h-8 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 leading-none uppercase tracking-tighter">AI Intelligence</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Gemini 2.0 Engine Active
              </p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-[32px] border border-gray-100 flex items-center gap-4 min-w-[200px]">
            <div className="p-2 bg-white rounded-xl shadow-sm">
               <Wallet className="w-4 h-4 text-blue-500" />
            </div>
            <div className="flex-1">
              <label className="text-[8px] font-black uppercase tracking-widest text-gray-400 block mb-0.5">Budget Cap</label>
              <input
                type="number"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
                className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-black text-gray-900 tracking-tight"
                placeholder="5000"
              />
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-10">
          <div className="relative">
            <div className="absolute -left-4 top-0 w-1 h-full bg-gray-100 rounded-full group-focus-within:bg-emerald-500 transition-colors" />
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Dump your daily expenses here...
Example:
- 300 for lunch with friends
- indriver 150 to mall
- Ali paid 500 back
- 1200 grocery store visit
- academic books 800"
              className="w-full bg-white border-none rounded-none py-2 px-4 min-h-[300px] focus:ring-0 transition-all text-gray-800 text-lg font-serif italic border-l border-gray-100 resize-none leading-relaxed placeholder:text-gray-300 scrollbar-hide"
            />
            
            <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-50">
              <div className="flex gap-2">
                 {['Roman Urdu', 'English', 'Mixed'].map(tag => (
                   <span key={tag} className="px-3 py-1 bg-gray-50 text-gray-400 text-[8px] font-black uppercase tracking-widest rounded-lg border border-gray-100">{tag}</span>
                 ))}
              </div>
              <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest leading-none">
                AI will categorize & extract values
              </p>
            </div>
          </div>

          <motion.button
            type="submit"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            disabled={isAnalyzing || !text.trim()}
            className={cn(
              "w-full py-8 rounded-[32px] font-black text-[12px] uppercase tracking-[0.4em] text-white flex items-center justify-center gap-4 transition-all shadow-2xl relative overflow-hidden",
              isAnalyzing 
                ? "bg-gray-100 text-gray-400 cursor-not-allowed shadow-none" 
                : "bg-gray-900 hover:bg-black shadow-gray-900/30"
            )}
          >
            {isAnalyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                >
                  <RotateCcw className="w-5 h-5 opacity-40" />
                </motion.div>
                Decrypting Ledger...
              </>
            ) : (
              <>
                Initialize Analysis <ArrowRight className="w-5 h-5 text-emerald-400" />
              </>
            )}
            
            {!isAnalyzing && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite] pointer-events-none" />
            )}
          </motion.button>
        </form>
      </div>
      
      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 px-6">
        {[
          { label: 'Security', val: 'End-to-End Encryption', icon: <Box size={14} /> },
          { label: 'Privacy', val: 'No personal data logged', icon: <Target size={14} /> }
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-4 text-gray-400 group/item">
             <div className="p-2.5 bg-white border border-gray-100 rounded-xl group-hover/item:text-emerald-500 transition-colors shadow-sm">
                {item.icon}
             </div>
             <div>
               <p className="text-[9px] font-black uppercase tracking-widest leading-none mb-1">{item.label}</p>
               <p className="text-[10px] font-bold text-gray-500">{item.val}</p>
             </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
