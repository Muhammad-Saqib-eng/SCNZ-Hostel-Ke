import React from 'react';
import { motion } from 'framer-motion';
import { Wallet, ArrowRight, ShieldCheck, Zap } from 'lucide-react';
import { auth } from '../lib/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export function Login() {
  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/20 via-[#0A0C10] to-[#0A0C10]">
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/5 border border-white/10 p-12 rounded-[40px] backdrop-blur-xl relative z-10 text-center shadow-2xl"
      >
        <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-10 rotate-6 shadow-xl shadow-emerald-500/20 ring-1 ring-white/20">
          <Wallet className="w-10 h-10 text-black" />
        </div>

        <h1 className="text-4xl font-black text-white tracking-tighter mb-4 leading-tight uppercase">
          SCNZ HOSTEL KE
        </h1>
        <p className="text-slate-400 text-lg mb-12 font-medium">
          Zero friction. AI-powered 'Khata' parsing. <br/> Built for the modern hostel resident.
        </p>

        <div className="space-y-6">
          <button
            onClick={handleLogin}
            className="w-full bg-white hover:bg-emerald-50 text-black py-5 rounded-2xl font-black text-lg tracking-tight shadow-xl shadow-white/5 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            Sign in with Google <ArrowRight className="w-5 h-5" />
          </button>

          <div className="grid grid-cols-2 gap-4 text-xs font-bold uppercase tracking-widest text-slate-500">
            <div className="flex items-center justify-center gap-2 border border-white/5 py-3 rounded-xl bg-white/5">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Secure
            </div>
            <div className="flex items-center justify-center gap-2 border border-white/5 py-3 rounded-xl bg-white/5">
              <Zap className="w-4 h-4 text-emerald-500" /> Fast AI
            </div>
          </div>
        </div>

        <p className="mt-12 text-[10px] text-slate-600 font-bold uppercase tracking-[0.2em]">
          GDG Pakistan AI Seekho 2026 • Saqib Bashir
        </p>
      </motion.div>
    </div>
  );
}
