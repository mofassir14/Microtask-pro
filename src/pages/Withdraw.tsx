import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { useSettings } from '../SettingsContext';
import { Wallet, ArrowUpCircle, AlertCircle, CheckCircle2, Loader2, History } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';

export default function Withdraw() {
  const { user, token, refreshUser } = useAuth();
  const { settings } = useSettings();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('Bkash');
  const [methodDetails, setMethodDetails] = useState('');
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
          setHistory(data.filter((t: any) => t.type === 'withdrawal'));
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
      const res = await fetch('/api/transactions/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          amount: parseFloat(amount), 
          method: `${method}: ${methodDetails}` 
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        toast.success('Withdrawal request submitted successfully');
        setAmount('');
        setMethodDetails('');
        refreshUser();
      } else {
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
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Withdraw Earnings</h1>
            <p className="text-slate-500">Transfer your hard-earned balance to your bank or wallet.</p>
          </div>

          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg shadow-indigo-200">
            <div className="flex items-center gap-3 mb-2 opacity-80">
              <Wallet className="w-5 h-5" />
              <span className="text-sm font-medium">Available for Withdrawal</span>
            </div>
            <p className="text-3xl font-bold">{formatCurrency(user?.balance || 0)}</p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-6"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Withdrawal Requested</h3>
                <p className="text-slate-500 mt-2">Your request is pending admin approval.</p>
                <button
                  onClick={() => setSuccess(false)}
                  className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  New Withdrawal
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Withdrawal Amount ($)</label>
                  <input
                    type="number"
                    required
                    min={settings?.min_withdrawal || "10"}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-lg"
                    placeholder="0.00"
                  />
                  <p className="text-xs text-slate-500 mt-2">Minimum withdrawal: ${settings?.min_withdrawal || "10.00"}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Payment Method</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
                    {['Bkash', 'Nagad', 'Rocket', 'Crypto', 'Bank'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={cn(
                          "px-4 py-2 rounded-lg border text-sm font-medium transition-all",
                          method === m ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-600 hover:border-indigo-200"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {method ? `${method} Details` : 'Payment Details'}
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={methodDetails}
                    onChange={(e) => setMethodDetails(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder={
                      method === 'Bkash' || method === 'Nagad' || method === 'Rocket' 
                        ? "Enter your mobile number" 
                        : method === 'Crypto' 
                        ? "Enter your USDT (TRC20) address" 
                        : "Enter Bank Name, A/C Number, etc."
                    }
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request Withdrawal'}
                  <ArrowUpCircle className="w-5 h-5" />
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-slate-400" />
            <h2 className="text-xl font-bold text-slate-900">Withdrawal History</h2>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {history.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {history.map((tx) => (
                  <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <p className="font-bold text-slate-900">{formatCurrency(tx.amount)}</p>
                      <p className="text-xs text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
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
                <p className="text-slate-400">No withdrawal history found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
