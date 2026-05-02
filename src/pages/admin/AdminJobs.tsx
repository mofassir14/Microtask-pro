import React, { useState, useEffect } from 'react';
import { useAuth } from '../../AuthContext';
import { Job } from '../../types';
import { Plus, Briefcase, Loader2, Sparkles, CheckCircle2, XCircle, Users, Power, Trash2 } from 'lucide-react';
import { formatCurrency, cn } from '../../lib/utils';
import { generateJobDescription } from '../../services/geminiService';
import { toast } from 'sonner';

export default function AdminJobs() {
  const { token } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'YouTube',
    reward: '0.05',
    totalSlots: '100',
  });

  const fetchJobs = async () => {
    const res = await fetch('/api/jobs', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setJobs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const handleAI = async () => {
    if (!formData.title) return alert('Please enter a title first');
    setGenerating(true);
    const desc = await generateJobDescription(formData.title, formData.category);
    setFormData({ ...formData, description: desc });
    setGenerating(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/admin/jobs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...formData,
        reward: parseFloat(formData.reward),
        totalSlots: parseInt(formData.totalSlots),
      }),
    });
    setShowModal(false);
    setFormData({ title: '', description: '', category: 'YouTube', reward: '0.05', totalSlots: '100' });
    fetchJobs();
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch(`/api/admin/jobs/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Job ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchJobs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to update status');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  const deleteJob = async (id: number) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    try {
      const res = await fetch(`/api/admin/jobs/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Job deleted successfully');
        fetchJobs();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Failed to delete job');
      }
    } catch (err) {
      toast.error('Network error. Please try again.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Job Management</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create New Job
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-slate-400">Loading jobs...</div>
        ) : jobs.map((job) => {
          const progress = (job.completed_slots / job.total_slots) * 100;
          return (
            <div key={job.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-col gap-1">
                  <span className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded uppercase tracking-wider w-fit">
                    {job.category}
                  </span>
                  <div className={cn(
                    "flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider",
                    job.status === 'active' ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {job.status === 'active' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {job.status}
                  </div>
                </div>
                <span className="font-bold text-emerald-600">{formatCurrency(job.reward)}</span>
              </div>
              
              <h3 className="font-bold text-slate-900 mb-4 line-clamp-1">{job.title}</h3>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    Slots
                  </div>
                  <span>{job.completed_slots} / {job.total_slots}</span>
                </div>
                
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full transition-all duration-500",
                      progress >= 100 ? "bg-emerald-500" : "bg-indigo-500"
                    )}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => deleteJob(job.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete Job"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toggleStatus(job.id, job.status)}
                    className={cn(
                      "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors",
                      job.status === 'active' 
                        ? "bg-amber-50 text-amber-600 hover:bg-amber-100" 
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    )}
                  >
                    <Power className="w-3 h-3" />
                    {job.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl overflow-hidden">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Create New Micro-Job</h2>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Title</label>
                    <input
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g. Subscribe to my YouTube"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {['YouTube', 'Facebook', 'App Install', 'Survey', 'Ads'].map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase">Description & Requirements</label>
                    <button
                      type="button"
                      onClick={handleAI}
                      disabled={generating}
                      className="flex items-center gap-1 text-[10px] font-bold text-indigo-600 hover:text-indigo-700 disabled:opacity-50"
                    >
                      {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      AI Generate
                    </button>
                  </div>
                  <textarea
                    required
                    rows={6}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    placeholder="Describe the steps and required proof..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reward ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={formData.reward}
                      onChange={(e) => setFormData({ ...formData, reward: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Total Slots</label>
                    <input
                      type="number"
                      required
                      value={formData.totalSlots}
                      onChange={(e) => setFormData({ ...formData, totalSlots: e.target.value })}
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                  Create Job
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
