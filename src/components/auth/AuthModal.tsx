import React, { useState } from 'react';
import { Mail, Lock, User, AtSign, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { authService } from '../../services/authService';

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalTab, closeAuthModal, openAuthModal, login, signUp } = useAuth();
  const { showToast } = useApp();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      showToast('Welcome back to TS Social Book!', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid login credentials';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password) {
      setErrorMessage('Please fill in all registration fields.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      await signUp({ name, username, email, password });
      showToast('Account created successfully! Welcome to TS Social Book.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to register';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your account email address.');
      return;
    }
    setErrorMessage('');
    setIsSubmitting(true);
    try {
      const res = await authService.sendPasswordResetEmail(email);
      setResetSent(true);
      showToast(res.message, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to send reset link';
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={authModalOpen} onClose={closeAuthModal} maxWidth="md">
      <div className="text-center mb-6">
        <BrandLogo size="lg" className="justify-center mb-2" />
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          {authModalTab === 'login' && 'Sign in to your account'}
          {authModalTab === 'signup' && 'Create your free account'}
          {authModalTab === 'forgot' && 'Reset your password'}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {authModalTab === 'login' && 'Connect with friends, share stories, and explore trending ideas.'}
          {authModalTab === 'signup' && 'Join thousands of members on TS Social Book.'}
          {authModalTab === 'forgot' && 'Enter your email to receive recovery instructions.'}
        </p>
      </div>

      {errorMessage && (
        <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-xl text-xs text-rose-600 dark:text-rose-400 font-medium">
          {errorMessage}
        </div>
      )}

      {/* LOGIN TAB */}
      {authModalTab === 'login' && (
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Password
              </label>
              <button
                type="button"
                onClick={() => openAuthModal('forgot')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-600 dark:text-slate-400">Remember session</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
          >
            {isSubmitting ? 'Signing In...' : 'Sign In'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Don't have an account yet?{' '}
            </span>
            <button
              type="button"
              onClick={() => openAuthModal('signup')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign up now
            </button>
          </div>
        </form>
      )}

      {/* SIGN UP TAB */}
      {authModalTab === 'signup' && (
        <form onSubmit={handleSignUp} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Username
            </label>
            <div className="relative">
              <AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="janedoe"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@example.com"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a strong password"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
          >
            {isSubmitting ? 'Creating Account...' : 'Complete Sign Up'}
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="text-center pt-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Already have an account?{' '}
            </span>
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Sign in
            </button>
          </div>
        </form>
      )}

      {/* FORGOT PASSWORD TAB */}
      {authModalTab === 'forgot' && (
        <div className="space-y-4">
          {resetSent ? (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
              <h3 className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">
                Reset Link Dispatched
              </h3>
              <p className="text-xs text-emerald-700 dark:text-emerald-300">
                Check {email} for instructions to reset your account password.
              </p>
              <button
                type="button"
                onClick={() => {
                  setResetSent(false);
                  openAuthModal('login');
                }}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl"
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Your Account Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                {isSubmitting ? 'Sending Instructions...' : 'Send Recovery Link'}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  ← Return to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
};
