
import React, { useState } from 'react';
import { LockIcon, ArrowLeftIcon } from './icons';

interface Props {
  type: 'owner' | 'gym' | 'member';
  mode?: 'login' | 'forgot' | 'reset';
  gymName?: string;
  onLogin: (passwordOrId: string) => boolean | void;
}

const Login: React.FC<Props> = ({ type, mode = 'login', gymName, onLogin }) => {
  const [val, setVal] = useState('');
  const [confirmVal, setConfirmVal] = useState(''); // For password reset
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (mode === 'forgot') {
        return;
    }

    if (mode === 'reset') {
        if (!val || val.length < 4) {
            setError('Password must be at least 4 characters.');
            return;
        }
        if (val !== confirmVal) {
            setError('Passwords do not match.');
            return;
        }
        onLogin(val);
        return;
    }

    // Default Login Mode
    if (!val) {
      setError('Field is required');
      return;
    }
    
    const result = onLogin(val);
    if (result === false) {
        setError('Invalid credentials. Please try again.');
    }
  };

  const renderTitle = () => {
      if (mode === 'forgot') return 'Security Hint';
      if (mode === 'reset') return 'Set New Password';
      return type === 'owner' ? 'Super Admin' : gymName || 'Gym Portal';
  };

  const renderSubtitle = () => {
      if (mode === 'forgot') return '';
      if (mode === 'reset') return 'Create a secure password for your account';
      return type === 'member' ? 'Member Access' : 'Secure Login';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black p-4">
      <div className="relative w-full max-w-md">
          {/* Decorative blur effect */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="bg-surface/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl border border-white/10 relative z-10">
            {/* Back to Home Link */}
            <div className="absolute top-4 left-4">
                <button onClick={() => window.location.hash = '#/landing'} className="text-gray-500 hover:text-white transition-colors flex items-center gap-1 text-xs font-medium">
                    <ArrowLeftIcon className="h-3 w-3" /> Home
                </button>
            </div>

            <div className="text-center mb-8 mt-4">
              <div className="inline-flex p-4 rounded-full bg-gradient-to-tr from-primary to-primary-hover shadow-lg shadow-primary/25 mb-4 transform hover:scale-105 transition-transform duration-300">
                <LockIcon className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                {renderTitle()}
              </h1>
              <p className="text-gray-400 text-sm font-medium uppercase tracking-widest min-h-[1.25rem]">
                {renderSubtitle()}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {mode === 'forgot' ? (
                  <div className="w-full bg-gradient-to-r from-primary to-primary-hover text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 text-center text-xl tracking-widest uppercase animate-fade-in-up">
                      PAF
                  </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                      {type === 'member' ? 'Registration Number' : (mode === 'reset' ? 'New Password' : 'Password')}
                    </label>
                    <input
                      type={type === 'member' ? 'text' : 'password'}
                      value={val}
                      onChange={(e) => { setVal(e.target.value); setError(''); }}
                      className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                      placeholder={type === 'member' ? 'e.g. SF-101' : '••••••••'}
                    />
                  </div>

                  {mode === 'reset' && (
                      <div className="space-y-2">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                          Confirm Password
                        </label>
                        <input
                          type="password"
                          value={confirmVal}
                          onChange={(e) => { setConfirmVal(e.target.value); setError(''); }}
                          className="w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-white placeholder-gray-600 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                          placeholder="••••••••"
                        />
                      </div>
                  )}

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <p className="text-red-400 text-sm text-center font-medium">{error}</p>
                    </div>
                  )}

                  <button className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all duration-300 transform active:scale-[0.98]">
                    {mode === 'reset' ? 'Set New Password' : (type === 'member' ? 'View Attendance' : 'Authenticate')}
                  </button>
                </>
              )}
            </form>
            
            <div className="mt-8 pt-6 border-t border-white/5 text-center">
                {mode === 'login' && type === 'owner' && (
                     <div className="mb-4">
                         <button onClick={() => window.location.hash = '#/owner/forgot-password'} className="text-sm text-primary hover:text-primary-hover hover:underline">Forgot Password?</button>
                     </div>
                )}
                {mode !== 'login' && (
                     <div className="mb-4">
                         <button onClick={() => window.location.hash = '#/owner/login'} className="text-sm text-gray-400 hover:text-white hover:underline">Back to Login</button>
                     </div>
                )}

                <p className="text-xs text-gray-600">
                    {mode === 'login' && type === 'gym' && 'Default: admin'}
                </p>
            </div>
          </div>
      </div>
    </div>
  );
};

export default Login;
