import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Proof } from '../../types';
import { Check, X, ExternalLink, Loader2, Image as ImageIcon } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

export default function AdminProofs() {
  const { token } = useAuth();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProofs = async () => {
    const res = await fetch('/api/admin/proofs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setProofs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProofs();
  }, [token]);

  const handleApprove = async (id: number) => {
    await fetch(`/api/admin/proofs/${id}/approve`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchProofs();
  };

  const handleReject = async (id: number) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    await fetch(`/api/admin/proofs/${id}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ reason }),
    });
    fetchProofs();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-900">Proof Verification</h1>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Job</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Proof Details</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Reward</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">Loading proofs...</td></tr>
              ) : proofs.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400">No pending proofs to review.</td></tr>
              ) : proofs.map((proof) => (
                <tr key={proof.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{proof.user_name}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{proof.job_title}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-slate-600 max-w-md truncate">{proof.proof_text}</div>
                    {proof.proof_image && (
                      <button
                        onClick={() => {
                          const win = window.open();
                          win?.document.write(`<img src="${proof.proof_image}" style="max-width: 100%;" />`);
                        }}
                        className="mt-2 flex items-center gap-1 text-xs text-indigo-600 font-semibold hover:underline"
                      >
                        <ImageIcon className="w-3 h-3" />
                        View Screenshot
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-bold text-emerald-600">{formatCurrency(proof.reward || 0)}</div>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => handleApprove(proof.id)}
                      className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Approve"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReject(proof.id)}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Reject"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
