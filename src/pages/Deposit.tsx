import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Wallet, CreditCard, AlertCircle, CheckCircle2, Loader2, ArrowRight, History } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Deposit() {
  const { token, refreshUser } = useAuth();
  const { settings } = useSettings();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bkash');
  const [senderNumber, setSenderNumber] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!token) return;
      try {
        const res = await fetch('/api/transactions/history', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (Array.isArray(data)) {
          setHistory(data.filter((t: any) => t.type === 'deposit'));
        }
      } catch (err) {
        console.error('Failed to fetch history:', err);
      }
    };
    fetchHistory();
  }, [token, success]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!amount || isNaN(parseFloat(amount))) {
      setError('Please enter a valid amount.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/transactions/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          method,
          senderNumber,
          transactionId
        }),
      });
      if (res.ok) {
        setSuccess(true);
        toast.success('Deposit request submitted successfully');
        setAmount('');
        setSenderNumber('');
        setTransactionId('');
        refreshUser();
      } else {
        const data = await res.json();
        const msg = data.error || 'Failed to submit request.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err) {
      setError('Network error. Please try again.');
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8">
        <div className="flex-1 space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Deposit Funds</h1>
            <p className="text-slate-500">Add balance to your account to start posting jobs or boost your profile.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Payment Methods</h2>
              <div className="space-y-3">
                {['Bkash', 'Nagad', 'Rocket', 'Crypto (USDT)', 'Manual Bank Transfer'].map((m) => (
                  <button
                    key={m}
                    onClick={() => setMethod(m)}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border transition-all",
                      method === m ? "border-indigo-600 bg-indigo-50" : "border-slate-100 bg-slate-50",
                      "hover:border-indigo-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <CreditCard className={cn("w-5 h-5", method === m ? "text-indigo-600" : "text-slate-400")} />
                      <span className={cn("font-medium", method === m ? "text-indigo-900" : "text-slate-600")}>{m}</span>
                    </div>
                    {method === m && <CheckCircle2 className="w-5 h-5 text-indigo-600" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Request Submitted</h3>
                  <p className="text-slate-500 mt-2">Please send the payment and wait for admin approval.</p>
                  <button
                    onClick={() => setSuccess(false)}
                    className="mt-6 text-indigo-600 font-semibold hover:underline"
                  >
                    Make another deposit
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Deposit Amount ($)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                      <input
                        type="number"
                        required
                        min={settings?.min_deposit || "5"}
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Minimum deposit: ${settings?.min_deposit || "5.00"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sender Number</label>
                      <input
                        type="text"
                        required
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="01XXXXXXXXX"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Transaction ID</label>
                      <input
                        type="text"
                        required
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="TRX12345678"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                    <h4 className="text-sm font-bold text-indigo-900 mb-2">Instructions for {method}:</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed">
                      {method === 'Bkash' && "Send money to: 017XXXXXXXX (Personal). Use your User ID as reference."}
                      {method === 'Nagad' && "Send money to: 018XXXXXXXX (Personal). Use your User ID as reference."}
                      {method === 'Rocket' && "Send money to: 019XXXXXXXX (Personal). Use your User ID as reference."}
                      {method === 'Crypto (USDT)' && "Send USDT (TRC20) to: TXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"}
                      {method === 'Manual Bank Transfer' && "Send to: Bank Name, A/C: 123456789, Branch: Dhaka."}
                    </p>
                    <p className="text-[10px] text-indigo-500 mt-2 italic">
                      * After sending, please submit this request. Verification takes up to 24 hours.
                    </p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Deposit Request'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        <div className="w-full md:w-80 space-y-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900">Deposit History</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {history.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                      <p className="text-[10px] text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                      <p className="text-[10px] text-indigo-600 font-medium">{tx.method}</p>
                    </div>
                    <span className={cn(
                      "px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                      tx.status === 'approved' ? "bg-emerald-100 text-emerald-700" :
                      tx.status === 'pending' ? "bg-amber-100 text-amber-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      {tx.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <p className="text-slate-400 text-sm">No deposit history found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
