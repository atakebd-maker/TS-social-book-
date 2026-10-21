import React, { useState } from 'react';
import {
  UserPlus,
  LogIn,
  Sparkles,
  Gamepad2,
  Video,
  Users,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Mail,
  User,
  AtSign,
  ArrowRight
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

export const AuthScreen: React.FC = () => {
  const { login, signUp, loginWithGoogle } = useAuth();
  const { showToast } = useApp();

  const [tab, setTab] = useState<'signup' | 'login'>('signup');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      setGoogleLoading(true);
      await loginWithGoogle();
      showToast('Welcome to TS Social Book! Signed in with Google.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google sign-in failed.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!username.trim()) {
      setError('Please choose a username.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    try {
      setLoading(true);
      await signUp({
        name: name.trim(),
        username: username.trim().toLowerCase().replace(/[^a-z0-9_]/g, ''),
        email: email.trim().toLowerCase(),
        password
      });
      showToast('Welcome to TS Social Book! Your account is ready.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Account creation failed.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    try {
      setLoading(true);
      await login(email.trim().toLowerCase(), password);
      showToast('Signed in successfully! Welcome back.', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials.';
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/40 to-indigo-50/50 flex flex-col justify-between font-sans">
      {/* Top Simple Header */}
      <header className="px-6 py-4 flex items-center justify-between border-b border-slate-200/70 bg-white/80 backdrop-blur-md">
        <BrandLogo size="md" />
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setTab('login');
              setError('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'login'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => {
              setTab('signup');
              setError('');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors ${
              tab === 'signup'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>
      </header>

      {/* Main Dual Stage Section */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-8 sm:py-12 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-16">
        {/* Left Stage: Welcome & Platform Highlights */}
        <div className="flex-1 text-left space-y-6 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-bold shadow-2xs">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>স্বাগতম TS Social Book-এ — আপনার নিজস্ব সোশ্যাল নেটওয়ার্ক</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Connect, Share &amp; Play with friends in real time.
          </h1>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
            সোশ্যাল বুক-এ যোগ দিন! আপনার বন্ধুদের সাথে যুক্ত থাকুন, মনের ভাবনা, ছবি ও ভিডিও প্রকাশ করুন এবং সরাসরি মজাদার গেমস খেলুন।
          </p>

          {/* Key Value Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
            <div className="flex items-start gap-3 p-3.5 bg-white/80 border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ভিডিও ও ফটো পোস্ট</h4>
                <p className="text-[11px] text-slate-500">HD ভিডিও দেখুন এবং নিজের পোস্ট তৈরি করুন</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-white/80 border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Gamepad2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">ইনস্ট্যান্ট গেমস সেন্টার</h4>
                <p className="text-[11px] text-slate-500">Snake, Memory, Tic-Tac-Toe সরাসরি ব্রাউজারে খেলুন</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-white/80 border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">কমিউনিটি ও ফ্রেন্ডস</h4>
                <p className="text-[11px] text-slate-500">নতুন বন্ধুদের সাথে পরিচিত হোন ও চ্যাট করুন</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-white/80 border border-slate-200/80 rounded-2xl shadow-2xs">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">নিরাপদ ও প্রাইভেট</h4>
                <p className="text-[11px] text-slate-500">সম্পূর্ণ নিয়ন্ত্রণ আপনার নিজের হাতে</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Stage: Interactive Form Card */}
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-8">
          {/* Tabs header */}
          <div className="flex rounded-2xl bg-slate-100 p-1 mb-6">
            <button
              type="button"
              onClick={() => {
                setTab('signup');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'signup'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Create Account</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setError('');
              }}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                tab === 'login'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          </div>

          {/* Direct Google Sign-In Button */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border-2 border-slate-200 hover:border-slate-300 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 shadow-sm flex items-center justify-center gap-3 transition-all active:scale-98 disabled:opacity-50 cursor-pointer mb-5"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>
              {tab === 'signup'
                ? 'Sign up with Google (সরাসরি গুগল দিয়ে খুলুন)'
                : 'Sign in with Google (গুগল দিয়ে সাইন ইন করুন)'}
            </span>
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-5">
            <div className="flex-1 h-px bg-slate-200" />
            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
              অথবা ইমেইল দিয়ে
            </span>
            <div className="flex-1 h-px bg-slate-200" />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {tab === 'signup' ? (
            /* Sign Up Form */
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Full Name (আপনার পুরো নাম)
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Md Piyas"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Username (@ইউজারনেম)
                </label>
                <div className="relative">
                  <AtSign className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. piyas_dev"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address (ইমেইল ঠিকানা)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@example.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password (পাসওয়ার্ড)
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account &amp; Enter</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-[11px] text-slate-500 text-center pt-2">
                By signing up, you agree to our Terms of Service &amp; Community Guidelines.
              </p>
            </form>
          ) : (
            /* Sign In Form */
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your registered email"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:ring-2 focus:ring-blue-100 outline-hidden transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Social Book</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-500">
                  New here?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setTab('signup');
                      setError('');
                    }}
                    className="text-blue-600 font-bold hover:underline"
                  >
                    Create an account now
                  </button>
                </span>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/40">
        &copy; {new Date().getFullYear()} TS Social Book — Connect, Share, Play &amp; Explore.
      </footer>
    </div>
  );
};
