import React, { useState, useEffect, useMemo } from 'react';
import { Job } from '../types';
import { useAuth } from '../AuthContext';
import { Search, Filter, Briefcase, Users, Clock, ChevronRight, ArrowUpDown, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { formatCurrency, cn } from '../lib/utils';

type SortOption = 'newest' | 'oldest' | 'reward-high' | 'reward-low';

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [minReward, setMinReward] = useState<string>('');
  const [maxReward, setMaxReward] = useState<string>('');
  const [hideFull, setHideFull] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  const { token } = useAuth();

  const categories = ['All', 'Facebook', 'YouTube', 'App Install', 'Survey', 'Ads'];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const res = await fetch('/api/jobs', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setJobs(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, [token]);

  const processedJobs = useMemo(() => {
    let result = [...jobs];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(j => 
        j.title.toLowerCase().includes(query) || 
        j.description.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (category !== 'All') {
      result = result.filter(j => j.category === category);
    }

    // Reward range filter
    if (minReward) {
      result = result.filter(j => j.reward >= parseFloat(minReward));
    }
    if (maxReward) {
      result = result.filter(j => j.reward <= parseFloat(maxReward));
    }

    // Hide full jobs filter
    if (hideFull) {
      result = result.filter(j => j.completed_slots < j.total_slots);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'reward-high':
          return b.reward - a.reward;
        case 'reward-low':
          return a.reward - b.reward;
        default:
          return 0;
      }
    });

    return result;
  }, [jobs, searchQuery, category, sortBy, minReward, maxReward]);

  const clearFilters = () => {
    setCategory('All');
    setSearchQuery('');
    setSortBy('newest');
    setMinReward('');
    setMaxReward('');
    setHideFull(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Available Jobs</h1>
            <p className="text-slate-500">Complete small tasks and earn rewards instantly.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-xl border transition-all flex items-center gap-2 text-sm font-medium",
                showFilters || minReward || maxReward 
                  ? "bg-indigo-50 border-indigo-200 text-indigo-600" 
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
              )}
            >
              <Filter className="w-4 h-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Reward Range ($)</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      placeholder="Min"
                      value={minReward}
                      onChange={(e) => setMinReward(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <span className="text-slate-400">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxReward}
                      onChange={(e) => setMaxReward(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="reward-high">Highest Reward</option>
                    <option value="reward-low">Lowest Reward</option>
                  </select>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={hideFull}
                        onChange={(e) => setHideFull(e.target.checked)}
                        className="sr-only"
                      />
                      <div className={cn(
                        "w-10 h-5 rounded-full transition-colors",
                        hideFull ? "bg-indigo-600" : "bg-slate-200"
                      )} />
                      <div className={cn(
                        "absolute left-1 top-1 w-3 h-3 bg-white rounded-full transition-transform",
                        hideFull ? "translate-x-5" : "translate-x-0"
                      )} />
                    </div>
                    <span className="text-sm font-medium text-slate-700 group-hover:text-indigo-600 transition-colors">Hide Full Jobs</span>
                  </label>
                  
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 text-slate-500 hover:text-slate-700 text-sm font-medium flex items-center justify-center gap-2 transition-colors border border-dashed border-slate-200 rounded-xl hover:bg-slate-50"
                  >
                    <X className="w-4 h-4" />
                    Clear All Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setHideFull(!hideFull)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border flex items-center gap-2",
              hideFull 
                ? "bg-amber-50 border-amber-200 text-amber-700 shadow-sm" 
                : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-amber-200"
            )}
          >
            <Users className={cn("w-4 h-4", hideFull ? "text-amber-600" : "text-slate-400")} />
            Hide Full Jobs
          </button>
          
          <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block" />

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap border",
                category === cat 
                  ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100" 
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50/50"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 animate-pulse h-64" />
          ))
        ) : processedJobs.length > 0 ? (
          processedJobs.map((job, idx) => (
            <motion.div
              key={job.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-indigo-100 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:bg-indigo-100/50" />
              
              <div className="relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-widest border border-indigo-100">
                    {job.category}
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xl font-black text-slate-900">{formatCurrency(job.reward)}</span>
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter">Per Task</span>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-indigo-600 transition-colors line-clamp-1">
                  {job.title}
                </h3>
                
                <p className="text-sm text-slate-500 mb-6 line-clamp-2 min-h-[2.5rem]">
                  {job.description}
                </p>

                <div className="space-y-4 mb-6">
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Users className="w-4 h-4 text-indigo-500" />
                      <span>{job.completed_slots} / {job.total_slots} Slots</span>
                    </div>
                    <span className="text-indigo-600">{Math.round((job.completed_slots / job.total_slots) * 100)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(job.completed_slots / job.total_slots) * 100}%` }}
                      className="bg-indigo-500 h-full rounded-full" 
                    />
                  </div>
                </div>

                <Link
                  to={`/jobs/${job.id}`}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
                >
                  Start Task
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Briefcase className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No matching jobs found</h3>
            <p className="text-slate-500 max-w-xs mx-auto mb-8">
              We couldn't find any jobs matching your current filters. Try broadening your search.
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-2 bg-indigo-600 text-white rounded-full font-bold hover:bg-indigo-700 transition-all"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
