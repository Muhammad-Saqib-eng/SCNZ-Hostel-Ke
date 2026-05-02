import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Plus, Trash2, ArrowRightLeft, CheckCircle2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { Debt } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { dbService } from '../services/dbService';
import { auth } from '../lib/firebase';

export function DebtSettler() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [newDebt, setNewDebt] = useState({ peerName: '', amount: '', description: '', type: 'owes_me' as const });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      return dbService.listenToDebts(user.uid, setDebts);
    }
  }, []);

  const addDebt = async () => {
    const user = auth.currentUser;
    if (!user || !newDebt.peerName || !newDebt.amount) return;
    
    await dbService.addDebt(user.uid, {
      userId: user.uid,
      peerName: newDebt.peerName,
      amount: parseFloat(newDebt.amount),
      description: newDebt.description || 'Hostel expense',
      type: newDebt.type,
      settled: false
    });
    setNewDebt({ peerName: '', amount: '', description: '', type: 'owes_me' });
  };

  const settleDebt = async (id: string) => {
    const user = auth.currentUser;
    if (user) {
      await dbService.settleDebt(user.uid, id);
    }
  };

  const deleteDebt = async (id: string) => {
    const user = auth.currentUser;
    if (user) {
      setIsDeleting(id);
      try {
        await dbService.deleteDebt(user.uid, id);
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const resetDebts = async () => {
    const user = auth.currentUser;
    if (user) {
      await dbService.resetDebts(user.uid);
      setShowResetConfirm(false);
    }
  };

  const pendingCount = debts.filter(d => !d.settled).length;
  
  const netSocialBalance = debts.reduce((acc, d) => {
    if (d.settled) return acc;
    return d.type === 'owes_me' ? acc + d.amount : acc - d.amount;
  }, 0);

  return (
    <div className="max-w-5xl mx-auto w-full px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-gray-900 rounded-full" />
            <div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none">Social Debt Tracker</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">{pendingCount} Pending Settlements</p>
            </div>
          </div>

          <div className="hidden sm:block h-10 w-px bg-gray-100" />

          <div>
             <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Net Social Balance</p>
             <p className={cn(
               "text-xl font-black tracking-tighter",
               netSocialBalance >= 0 ? "text-emerald-500" : "text-red-500"
             )}>
                {netSocialBalance > 0 ? '+' : ''}{formatCurrency(netSocialBalance)}
             </p>
          </div>
        </div>

        <div className="relative">
          {!showResetConfirm ? (
            <button 
              onClick={() => setShowResetConfirm(true)}
              className="text-[10px] font-black text-red-500 bg-white px-6 py-4 rounded-2xl flex items-center gap-2 uppercase tracking-[0.2em] shadow-sm border border-red-100 hover:bg-red-50 active:scale-95 transition-all"
            >
              <RotateCcw size={14} /> Reset Debts
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-500 p-1.5 rounded-2xl shadow-xl animate-in fade-in zoom-in-95">
              <button 
                onClick={resetDebts}
                className="px-4 py-2 bg-white text-red-600 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-50"
              >
                Pakka? Reset All
              </button>
              <button onClick={() => setShowResetConfirm(false)} className="p-2 text-white/80 hover:text-white">
                <X size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Input Panel */}
        <div className="lg:col-span-5">
          <div className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.03)] sticky top-32">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-gray-900 text-white rounded-2xl shadow-lg shadow-gray-900/20">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-gray-900">New Udhaar Entry</h3>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 px-2">Roommate / Friend</label>
                <input
                  placeholder="e.g. Ali"
                  value={newDebt.peerName}
                  onChange={(e) => setNewDebt({ ...newDebt, peerName: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-gray-900/5 font-bold tracking-tight text-gray-800 placeholder:text-gray-300"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-400 px-2">Balance (PKR)</label>
                <input
                  type="number"
                  placeholder="0.00"
                  value={newDebt.amount}
                  onChange={(e) => setNewDebt({ ...newDebt, amount: e.target.value })}
                  className="w-full bg-gray-50 border-none rounded-2xl py-5 px-6 focus:ring-2 focus:ring-gray-900/5 font-black text-2xl tracking-tighter text-gray-900"
                />
              </div>

              <div className="flex gap-3 p-1.5 bg-gray-50 rounded-2xl">
                <button
                  onClick={() => setNewDebt({...newDebt, type: 'owes_me'})}
                  className={cn(
                    "flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    newDebt.type === 'owes_me' ? "bg-white text-emerald-600 shadow-sm border border-emerald-100" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  Owes Me
                </button>
                <button
                  onClick={() => setNewDebt({...newDebt, type: 'i_owe'})}
                  className={cn(
                    "flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    newDebt.type === 'i_owe' ? "bg-white text-red-600 shadow-sm border border-red-100" : "text-gray-400 hover:text-gray-600"
                  )}
                >
                  I Owe
                </button>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={addDebt}
                className="w-full mt-4 bg-gray-900 text-white py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] hover:bg-black transition-all shadow-xl shadow-gray-900/20"
              >
                Commit Transaction
              </motion.button>
            </div>
          </div>
        </div>

        {/* List Panel */}
        <div className="lg:col-span-7 space-y-6">
          <AnimatePresence mode="popLayout">
            {debts.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-[40px] p-24 border border-gray-100 shadow-sm text-center"
              >
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                  <CheckCircle2 size={40} />
                </div>
                <h4 className="text-sm font-black text-gray-500 uppercase tracking-widest mb-2">Debt Balance: Zero</h4>
                <p className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">No outstanding balances found</p>
              </motion.div>
            ) : (
              debts.slice().reverse().map((debt, idx) => (
                <motion.div
                  key={debt.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={cn(
                    "bg-white rounded-[32px] p-8 border transition-all flex items-center justify-between group relative overflow-hidden",
                    debt.settled ? "opacity-40 grayscale blur-[0.5px]" : "border-gray-100 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-900/5",
                    !debt.settled && (debt.type === 'owes_me' ? "hover:border-emerald-100" : "hover:border-red-100")
                  )}
                >
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute left-0 top-0 bottom-0 w-1.5 transition-all opacity-0 group-hover:opacity-100",
                    debt.type === 'owes_me' ? "bg-emerald-500" : "bg-red-500"
                  )} />

                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "w-16 h-16 rounded-3xl flex items-center justify-center transition-all group-hover:scale-110",
                      debt.type === 'owes_me' ? "bg-emerald-50 text-emerald-600" : "bg-red-50 text-red-600"
                    )}>
                      <User size={24} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <p className="text-lg font-black text-gray-900 uppercase tracking-tighter">{debt.peerName}</p>
                        {debt.settled && (
                           <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg text-[8px] font-black uppercase tracking-widest">Settled</span>
                        )}
                      </div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
                        {debt.type === 'owes_me' ? 'Receivable Asset' : 'Payable Liability'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={cn(
                        "text-2xl font-black tracking-tighter transition-all group-hover:scale-110 origin-right",
                        debt.type === 'owes_me' ? "text-emerald-600" : "text-red-500"
                      )}>
                        {debt.type === 'owes_me' ? '+' : '-'}{formatCurrency(debt.amount)}
                      </p>
                      <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Net Value</p>
                    </div>
                    
                    <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity pl-4">
                      {confirmDeleteId === debt.id ? (
                        <div className="flex items-center gap-2 bg-red-500 p-1 rounded-xl animate-in slide-in-from-right-4">
                          <button 
                            type="button"
                            onClick={() => { deleteDebt(debt.id); setConfirmDeleteId(null); }}
                            className="px-3 py-1.5 bg-white text-red-600 text-[8px] font-black uppercase tracking-widest rounded-lg"
                          >
                            Sure
                          </button>
                          <button 
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="p-1.5 text-white hover:bg-white/10 rounded-lg"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2">
                          {!debt.settled && (
                            <button
                              onClick={() => settleDebt(debt.id)}
                              className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                            >
                              <CheckCircle2 size={18} />
                            </button>
                          )}
                          <button
                            onClick={() => setConfirmDeleteId(debt.id)}
                            disabled={isDeleting === debt.id}
                            className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                          >
                             {isDeleting === debt.id ? (
                               <RotateCcw size={18} className="animate-spin" />
                             ) : (
                               <Trash2 size={18} />
                             )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

