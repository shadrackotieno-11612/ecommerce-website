import React, { useState } from 'react';
import { useI18n } from '../i18n/index.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import { SupportedLanguage, SUPPORTED_LANGUAGES } from '../types/index.ts';
import { X, Lock, Mail, User, Phone, Globe, AlertCircle, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { t, language } = useI18n();
  const {
    authModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    login,
    register,
  } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredLang, setPreferredLang] = useState<SupportedLanguage>(language);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (authModalMode === 'login') {
        const res = await login(email, password);
        if (!res.success) {
          setError(res.error || t.errors.invalidCredentials);
        }
      } else if (authModalMode === 'register') {
        if (password !== confirmPassword) {
          setError(t.auth.passwordsDoNotMatch);
          setIsLoading(false);
          return;
        }
        if (password.length < 6) {
          setError(t.auth.passwordTooShort);
          setIsLoading(false);
          return;
        }

        const res = await register({
          fullName,
          email,
          phone,
          password,
          preferredLanguage: preferredLang,
        });

        if (!res.success) {
          setError(res.error || 'Registration failed');
        }
      } else if (authModalMode === 'forgot') {
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (res.ok) {
          setSuccessMsg(data.message);
        } else {
          setError(data.error || t.errors.userNotFound);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoAccount = (role: 'admin' | 'customer') => {
    if (role === 'admin') {
      setEmail('admin@zawadi.co.ke');
      setPassword('Admin@2026!');
    } else {
      setEmail('customer@zawadi.co.ke');
      setPassword('Customer@2026!');
    }
    setAuthModalMode('login');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={closeAuthModal}
        className="fixed inset-0 bg-black/65 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden border border-stone-100 z-10 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-stone-900 to-emerald-950 text-white relative">
          <button
            onClick={closeAuthModal}
            className="absolute top-4 right-4 p-1.5 rounded-full text-stone-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-emerald-600/30 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-black font-['Outfit',sans-serif]">
            {authModalMode === 'login'
              ? t.auth.loginTitle
              : authModalMode === 'register'
              ? t.auth.registerTitle
              : t.auth.forgotPasswordTitle}
          </h2>
          <p className="text-xs text-stone-300 mt-1">
            {authModalMode === 'login'
              ? t.auth.loginSubtitle
              : authModalMode === 'register'
              ? t.auth.registerSubtitle
              : t.auth.forgotPasswordSubtitle}
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {authModalMode === 'register' && (
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  {t.auth.fullName} *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="David Kiprono"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs text-black font-semibold placeholder:text-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                {t.auth.email} *
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs text-black font-semibold placeholder:text-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                />
              </div>
            </div>

            {authModalMode === 'register' && (
              <>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    {t.auth.phone} (M-Pesa) *
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0712 345 678"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs text-black font-semibold placeholder:text-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    {t.auth.preferredLanguage} *
                  </label>
                  <div className="relative">
                    <Globe className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                    <select
                      value={preferredLang}
                      onChange={(e) => setPreferredLang(e.target.value as SupportedLanguage)}
                      className="w-full pl-9 pr-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs text-black font-semibold focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                    >
                      {SUPPORTED_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code} className="text-black font-semibold">
                          {l.flag} {l.nativeName} ({l.name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}

            {authModalMode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-stone-800">{t.auth.password} *</label>
                  {authModalMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => setAuthModalMode('forgot')}
                      className="text-[11px] font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer"
                    >
                      {t.auth.forgotPasswordLink}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs text-black font-semibold placeholder:text-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            {authModalMode === 'register' && (
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  {t.auth.confirmPassword} *
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border-2 border-stone-300 rounded-xl text-xs text-black font-semibold placeholder:text-stone-500 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 focus:outline-hidden"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-md transition cursor-pointer active:scale-98 disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                t.common.loading
              ) : authModalMode === 'login' ? (
                t.auth.signInButton
              ) : authModalMode === 'register' ? (
                t.auth.registerButton
              ) : (
                t.auth.sendResetLink
              )}
            </button>
          </form>

          {/* Quick Demo Logins Helper */}
          <div className="pt-3 border-t border-stone-100">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2 text-center">
              {t.auth.orContinueWith}
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemoAccount('admin')}
                className="px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-900 text-[11px] font-bold text-center transition cursor-pointer"
              >
                Demo Admin
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('customer')}
                className="px-2.5 py-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-[11px] font-bold text-center transition cursor-pointer"
              >
                Demo Customer
              </button>
            </div>
          </div>

          {/* Toggle between Login and Register */}
          <div className="text-center text-xs text-stone-500 pt-1">
            {authModalMode === 'login' ? (
              <span>
                {t.auth.noAccount}{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('register')}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {t.auth.registerButton}
                </button>
              </span>
            ) : (
              <span>
                {t.auth.alreadyHaveAccount}{' '}
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="font-bold text-emerald-700 hover:underline cursor-pointer"
                >
                  {t.auth.signInButton}
                </button>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
