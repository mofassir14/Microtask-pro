import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import { Shield, Loader2, CheckCircle2, XCircle, Smartphone } from 'lucide-react';

export default function TwoFactorSetup() {
  const { token, user, refreshUser } = useAuth();
  const [step, setStep] = useState<'initial' | 'setup' | 'verify'>('initial');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setQrCode(data.qrCode);
        setSecret(data.secret);
        setStep('setup');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to initiate 2FA setup');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
        setStep('initial');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to enable 2FA');
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    const verificationCode = prompt('Enter 2FA code to disable:');
    if (!verificationCode) return;

    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: verificationCode }),
      });
      const data = await res.json();
      if (res.ok) {
        await refreshUser();
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to disable 2FA');
    } finally {
      setLoading(false);
    }
  };

  if (user?.two_factor_enabled) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-bold text-emerald-900">2FA is Enabled</h4>
            <p className="text-sm text-emerald-700">Your account is protected with two-factor authentication.</p>
          </div>
        </div>
        <button
          onClick={handleDisable}
          disabled={loading}
          className="px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg font-bold hover:bg-emerald-100 transition-colors disabled:opacity-50"
        >
          Disable
        </button>
      </div>
    );
  }

  if (step === 'setup') {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <Smartphone className="w-12 h-12 text-indigo-600 mx-auto" />
          <h4 className="text-xl font-bold text-slate-900">Setup Authenticator</h4>
          <p className="text-slate-500 text-sm max-w-sm mx-auto">
            Scan the QR code with your authenticator app (like Google Authenticator or Authy).
          </p>
        </div>

        <div className="flex justify-center">
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
          </div>
        </div>

        <div className="text-center space-y-2">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Or enter this code manually</p>
          <div className="bg-white px-4 py-2 rounded-lg border border-slate-200 font-mono text-lg font-bold text-slate-700 tracking-widest inline-block">
            {secret}
          </div>
        </div>

        <div className="space-y-4 max-w-xs mx-auto">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Verification Code</label>
            <input
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-center text-2xl tracking-widest font-bold"
            />
          </div>
          {error && <p className="text-xs text-red-600 text-center">{error}</p>}
          <div className="flex gap-3">
            <button
              onClick={() => setStep('initial')}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 rounded-lg font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleEnable}
              disabled={loading || code.length !== 6}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Verify & Enable'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center">
          <Shield className="w-6 h-6 text-slate-400" />
        </div>
        <div>
          <h4 className="font-bold text-slate-900">Two-Factor Authentication</h4>
          <p className="text-sm text-slate-500">Add an extra layer of security to your account.</p>
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>
      </div>
      <button
        onClick={handleSetup}
        disabled={loading}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enable 2FA'}
      </button>
    </div>
  );
}
