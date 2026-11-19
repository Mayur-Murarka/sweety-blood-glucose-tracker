import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Lock, Mail, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import Alert from '../components/Alert';

export default function LoginPage({ onNavigateRegister }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('demo@kenpath.com');
    setPassword('Password123!');
    setError('');
    setIsSubmitting(true);
    try {
      await login('demo@kenpath.com', 'Password123!');
    } catch (err) {
      setError(err.message || 'Demo login failed. Make sure the backend seed script has run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDoctorLogin = async () => {
    setEmail('doctor@kenpath.com');
    setPassword('Password123!');
    setError('');
    setIsSubmitting(true);
    try {
      await login('doctor@kenpath.com', 'Password123!');
    } catch (err) {
      setError(err.message || 'Doctor login failed. Make sure the backend seed script has run.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-slate-50">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/25 mb-4">
          <HeartPulse className="w-8 h-8 animate-pulse" />
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to Sweety
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Personal Blood Glucose & Diabetes Management Tracker
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-3xl sm:px-10">
          {error && (
            <div className="mb-6">
              <Alert type="error" message={error} onClose={() => setError('')} />
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center space-x-2 py-2.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all disabled:opacity-50"
            >
              <span>{isSubmitting ? 'Signing in...' : 'Sign in to Sweety'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100 space-y-2">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-xl transition-colors"
            >
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <span>One-Click Demo Patient Login</span>
            </button>

            <button
              type="button"
              onClick={handleDoctorLogin}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center space-x-2 py-2 px-4 border border-teal-300 bg-teal-50/70 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-xl transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>One-Click Demo Doctor Login (Dr. Sarah Mitchell, MD)</span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-1.5">
              Pre-seeded with patient & doctor credentials for evaluator review
            </p>
          </div>

          <div className="mt-6 text-center text-xs text-slate-600">
            Don't have an account yet?{' '}
            <button
              onClick={onNavigateRegister}
              className="font-semibold text-emerald-700 hover:underline"
            >
              Create an account
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center space-x-2 text-xs text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Passwords securely hashed with bcrypt. User-isolated data.</span>
        </div>
      </div>
    </div>
  );
}
