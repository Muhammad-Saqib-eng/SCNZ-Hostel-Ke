import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { Sidebar } from './components/Sidebar';
import { Login } from './components/Login';
import { Dashboard } from './components/Dashboard';
import { ExpenseInput } from './components/ExpenseInput';
import { DebtSettler } from './components/DebtSettler';
import { dbService } from './services/dbService';
import { parseExpenses } from './services/geminiService';
import { Expense, Debt, AnalysisResult, Category, UserProfile } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { RefreshCw } from 'lucide-react';

export default function App() {
  const [currUser, setCurrUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'dashboard' | 'parser' | 'debts' | 'settings'>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      setCurrUser(user);
      setLoading(false);
    });

    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!currUser) {
      setExpenses([]);
      setDebts([]);
      setUserProfile(null);
      return;
    }

    const loadProfile = async () => {
      const profile = await dbService.getUserProfile(currUser.uid);
      setUserProfile(profile || { allowance: 5000 });
    };
    
    loadProfile();
    
    const unsubEx = dbService.listenToExpenses(currUser.uid, setExpenses);
    const unsubDb = dbService.listenToDebts(currUser.uid, setDebts);
    
    return () => {
      unsubEx();
      unsubDb();
    };
  }, [currUser]);

  const handleAIParse = async (text: string, allowance: number) => {
    if (!currUser) return;
    setIsAnalyzing(true);
    try {
      const result = await parseExpenses(text, allowance);
      
      // Update allowance if changed in the parser
      if (allowance !== userProfile?.allowance) {
        await dbService.updateUserProfile(currUser.uid, { allowance });
        setUserProfile((prev) => prev ? { ...prev, allowance } : { allowance });
      }

      // Save expenses to Firebase
      for (const exp of result.expenses) {
        await dbService.addExpense(currUser.uid, exp);
      }

      // Save debts to Firebase
      if (result.debts) {
        for (const debt of result.debts) {
          await dbService.addDebt(currUser.uid, debt);
        }
      }

      setActiveView('dashboard');
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error parsing khata");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0C10] flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
          <RefreshCw className="w-8 h-8 text-emerald-500 opacity-20" />
        </motion.div>
      </div>
    );
  }

  if (!currUser) return <Login />;

  // Financial Connectivity Logic:
  // 1. Unsettled 'owes_me' (Lending): Money is out of pocket, counts as outflow.
  // 2. Settled 'i_owe' (Payment): You finally paid, money is gone, counts as outflow.
  const debtAdjustments = debts.reduce((acc, d) => {
    if (d.type === 'owes_me' && !d.settled) return acc + d.amount;
    if (d.type === 'i_owe' && d.settled) return acc + d.amount;
    return acc;
  }, 0);

  const totalSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0) + debtAdjustments;
  const allowance = userProfile?.allowance || 5000;
  const remaining = allowance - totalSpent;

  // Dynamic Vibe Advice Generation
  const generateVibeAdvice = () => {
    const advice = [];
    const burnRate = (totalSpent / allowance) * 100;
    const itemsCount = expenses.length;

    if (burnRate > 90) {
      advice.push({ 
        title: "Khatra Level: Red", 
        description: "Bhai, budget ki watt lag chuki hai. Ab se month end tak sirf chai biscuit pe guzara karna parega.", 
        severity: 'error' 
      });
    } else if (burnRate > 75) {
      advice.push({ 
        title: "Warning Alert", 
        description: "Allowance khatam hone ke qareeb hai. Thora hath rok lo warna doston se udhaar lena parega.", 
        severity: 'warning' 
      });
    } else if (burnRate > 50) {
      advice.push({ 
        title: "Mid-Month Check", 
        description: "Aadhey paisay urr chukay hain. Track sahi hai lekin thora sambhal ke.", 
        severity: 'info' 
      });
    } else if (itemsCount > 0) {
      advice.push({ 
        title: "Safe Zone", 
        description: "Abhi tak mahol tight hai. Allowance bachi hui hai, sakoon se raho.", 
        severity: 'info' 
      });
    }

    const socialSpending = expenses.filter(e => e.category === 'Social').reduce((a, c) => a + c.amount, 0);
    if (socialSpending > (allowance * 0.3)) {
      advice.push({ 
        title: "Social Butterfly?", 
        description: "Doston pe bohot kharch kar rahe ho. Kabhi unko bhi khilane ka moka do!", 
        severity: 'warning' 
      });
    }

    const miscellaneous = expenses.filter(e => e.category === 'Misc').reduce((a, c) => a + c.amount, 0);
    if (miscellaneous > (allowance * 0.2)) {
      advice.push({ 
        title: "Misc Overflow", 
        description: "Fazool kharchi bohot ho rahi hai matching missing category assets.", 
        severity: 'warning' 
      });
    }

    if (itemsCount === 0) {
      advice.push({ 
        title: "Khali Khali Khata", 
        description: "Abhi tak koi kharcha add nahi kia? Ya tou tum bohot ameer ho ya bohot bhoolay.", 
        severity: 'info' 
      });
    }

    return advice;
  };

  // Transform data for Dashboard component
  const dashboardData: AnalysisResult = {
    expenses,
    debts,
    summary: {
      totalBudget: allowance,
      totalSpent,
      remaining,
      categories: [
        { category: 'Food' as Category, amount: expenses.filter(e => e.category === 'Food').reduce((a, c) => a + c.amount, 0), percentage: 0 },
        { category: 'Transport' as Category, amount: expenses.filter(e => e.category === 'Transport').reduce((a, c) => a + c.amount, 0), percentage: 0 },
        { category: 'Social' as Category, amount: expenses.filter(e => e.category === 'Social').reduce((a, c) => a + c.amount, 0), percentage: 0 },
        { category: 'Utilities' as Category, amount: expenses.filter(e => e.category === 'Utilities').reduce((a, c) => a + c.amount, 0), percentage: 0 },
        { category: 'Academic' as Category, amount: expenses.filter(e => e.category === 'Academic').reduce((a, c) => a + c.amount, 0), percentage: 0 },
        { category: 'Misc' as Category, amount: expenses.filter(e => e.category === 'Misc').reduce((a, c) => a + c.amount, 0), percentage: 0 },
      ].filter(c => c.amount > 0)
    },
    advice: generateVibeAdvice()
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar 
        activeView={activeView} 
        onViewChange={setActiveView} 
        user={currUser} 
      />
      
      <main className="ml-72 flex-1 relative overflow-y-auto max-h-screen">
        {/* Header Bar */}
        <header className="sticky top-0 z-40 bg-white/50 backdrop-blur-xl border-b border-gray-100 px-12 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-gray-900 uppercase">
              {activeView === 'dashboard' ? 'Vibe Analytics' : 
               activeView === 'parser' ? 'AI Khata Parser' : 
               activeView === 'debts' ? 'Debt Settler' : 'App Profile'}
            </h1>
          </div>
        </header>

        <div className="p-12">
          <AnimatePresence mode="wait">
            {activeView === 'dashboard' && (
              <motion.div key="dash" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <Dashboard data={dashboardData} />
              </motion.div>
            )}
            
            {activeView === 'parser' && (
              <motion.div key="parser" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black tracking-tighter text-gray-900 mb-4">Paste Your Brain Dump.</h2>
                  <p className="text-gray-500 max-w-lg mx-auto font-medium">Just copy-paste your expense notes, messages, or lists. Our Gemini 2.0 AI handles the rest.</p>
                </div>
                <ExpenseInput onAnalyze={handleAIParse} isAnalyzing={isAnalyzing} />
              </motion.div>
            )}

            {activeView === 'debts' && (
              <motion.div key="debts" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <DebtSettler />
              </motion.div>
            )}

            {activeView === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto space-y-8">
                <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black mb-8 tracking-tight uppercase">Budget Settings</h3>
                  <div className="space-y-6">
                    <div>
                      <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 mb-3 block">Monthly Budget (PKR)</label>
                      <input 
                        type="number" 
                        value={userProfile?.allowance}
                        onChange={async (e) => {
                          const val = parseFloat(e.target.value);
                          setUserProfile({ ...userProfile, allowance: val });
                          await dbService.updateUserProfile(currUser.uid, { allowance: val });
                        }}
                        className="w-full bg-gray-50 border-none px-6 py-4 rounded-2xl text-lg font-bold focus:ring-2 focus:ring-emerald-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-[32px] p-10 border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black mb-8 tracking-tight uppercase">Tech Stack & Security</h3>
                  <div className="grid grid-cols-2 gap-6">
                    {[
                      { label: 'Frontend', val: 'React + Tailwind' },
                      { label: 'Backend', val: 'Firebase Serverless' },
                      { label: 'AI Engine', val: 'Gemini 2.0 Flash' },
                      { label: 'Security', val: 'JWT + Firestore Rules' },
                    ].map((item) => (
                      <div key={item.label} className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{item.label}</p>
                        <p className="text-sm font-black text-gray-900">{item.val}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
