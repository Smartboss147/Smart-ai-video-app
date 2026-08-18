import React, { useState, useEffect } from 'react';
import { CreditCard, Sparkles, Plus, Clock, CheckCircle2 } from 'lucide-react';
import { User } from '../types';

interface UsageViewProps {
  user: User;
  token: string;
  onUserUpdate: (updated: User) => void;
}

export const UsageView: React.FC<UsageViewProps> = ({ user, token, onUserUpdate }) => {
  const [usageRecords, setUsageRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await fetch('/api/usage', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setUsageRecords(data.usage || []);
        if (data.user) onUserUpdate(data.user);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleTopUp = async (amount: number) => {
    try {
      const res = await fetch('/api/credits/topup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        onUserUpdate(data.user);
        fetchUsage();
        alert(`Successfully added ${amount} credits!`);
      }
    } catch (e) {
      alert('Top up failed');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white flex items-center space-x-3">
              <CreditCard className="w-8 h-8 text-indigo-400" />
              <span>Credits & Usage</span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Manage your credit balance, view generation costs, and top up your account.
            </p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="p-8 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-900 border border-indigo-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10">
          <div>
            <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold">Current Balance</span>
            <div className="flex items-baseline space-x-3 mt-1">
              <span className="text-4xl font-extrabold text-white">{user.credits}</span>
              <span className="text-slate-400 font-medium">Credits Available</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Tier: <strong className="text-white uppercase">{user.tier}</strong> • Storage: {(user.storageUsedBytes / (1024 * 1024)).toFixed(1)} MB / 10 GB
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => handleTopUp(50)}
              className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs shadow-lg flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+50 Credits ($10)</span>
            </button>
            <button
              onClick={() => handleTopUp(200)}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 flex items-center space-x-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+200 Credits ($35)</span>
            </button>
          </div>
        </div>

        {/* Usage History */}
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-white">Usage & Transaction History</h3>
            <span className="text-xs text-slate-400">{usageRecords.length} Records</span>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-400">Loading history...</div>
          ) : usageRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400">No usage records found.</div>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {usageRecords.map((rec) => (
                <div key={rec.id} className="px-6 py-4 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{rec.action}</p>
                    <p className="text-slate-400 mt-0.5 flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(rec.timestamp).toLocaleString()}</span>
                    </p>
                  </div>
                  <span className={`font-mono font-bold ${rec.creditsCost > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {rec.creditsCost > 0 ? `-${rec.creditsCost} Credits` : `+${Math.abs(rec.creditsCost)} Credits`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
