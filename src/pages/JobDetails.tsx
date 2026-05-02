import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Job } from '../types';
import { useAuth } from '../AuthContext';
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { formatCurrency } from '../lib/utils';

export default function JobDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token, refreshUser } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proofText, setProofText] = useState('');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const res = await fetch(`/api/jobs/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setJob(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [id, token]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError('Image size must be less than 2MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/jobs/submit-proof', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId: id, proofText, proofImage }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        refreshUser();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to submit proof. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]">Loading...</div>;
  if (!job) return <div>Job not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/jobs')}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Jobs
      </button>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full uppercase tracking-wider">
                {job.category}
              </span>
              <h1 className="text-3xl font-bold text-slate-900 mt-3">{job.title}</h1>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Reward</p>
              <p className="text-3xl font-bold text-emerald-600">{formatCurrency(job.reward)}</p>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{job.completed_slots} / {job.total_slots} Slots Filled</span>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <section>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Job Description</h2>
            <div className="prose prose-slate max-w-none text-slate-600 whitespace-pre-line">
              {job.description}
            </div>
          </section>

          <section className="bg-slate-50 rounded-xl p-6 border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Submit Your Proof</h2>
            {success ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-8 text-center"
              >
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Proof Submitted!</h3>
                <p className="text-slate-500 mt-2">Admin will review your work shortly.</p>
                <button
                  onClick={() => navigate('/jobs')}
                  className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-lg font-semibold"
                >
                  Find More Jobs
                </button>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Proof Details (Text or Link)
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={proofText}
                    onChange={(e) => setProofText(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Enter the required proof here (e.g., your username, screenshot link, etc.)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Screenshot Proof (Optional)
                  </label>
                  <div className="flex items-center gap-4">
                    <label className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 transition-all">
                      <ImageIcon className="w-5 h-5 text-slate-400" />
                      <span className="text-sm text-slate-500 font-medium">
                        {proofImage ? 'Change Image' : 'Upload Screenshot'}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    {proofImage && (
                      <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200">
                        <img src={proofImage} alt="Proof preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProofImage(null)}
                          className="absolute top-0 right-0 bg-red-500 text-white p-0.5 rounded-bl-lg"
                        >
                          <AlertCircle className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Submit Proof'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
