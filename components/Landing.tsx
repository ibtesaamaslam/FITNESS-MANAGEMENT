
import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { LockIcon, UserIcon, WarningIcon, ServerIcon } from './icons';

const Landing: React.FC = () => {
    const [inputSlug, setInputSlug] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sysStatus, setSysStatus] = useState<'checking' | 'online' | 'offline'>('checking');

    // Check Backend Connection on Mount
    useEffect(() => {
        const checkConnection = async () => {
            try {
                // Simple query to check if we can talk to the DB
                const { error } = await supabase.from('gyms').select('id').limit(1);
                if (error) {
                    console.error('Supabase connection error:', error);
                    setSysStatus('offline');
                } else {
                    setSysStatus('online');
                }
            } catch (err) {
                setSysStatus('offline');
            }
        };
        checkConnection();
    }, []);

    const handleGo = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if(!inputSlug) {
            setError('Please enter a Gym ID');
            return;
        }

        setLoading(true);
        const clean = inputSlug.toLowerCase().replace(/\s+/g, '-');
        
        try {
            // Check if gym exists and verify password
            const { data: gym, error } = await supabase
                .from('gyms')
                .select('slug, adminPassword')
                .eq('slug', clean)
                .single();

            if (error || !gym) {
                setError("Gym ID not found.");
            } else {
                const correctPass = gym.adminPassword || 'admin';
                if (password === correctPass) {
                    window.location.hash = `#/g/${clean}/dashboard`;
                } else {
                    setError("Incorrect Password");
                }
            }
        } catch (err) {
            setError("Connection failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
            
            {/* Background Effects */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[150px]"></div>
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[150px]"></div>
            </div>

            {/* --- SYSTEM STATUS: TOP LEFT --- */}
            <div className="fixed top-6 left-6 z-50 animate-fade-in">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-md transition-colors ${
                    sysStatus === 'online' ? 'bg-green-500/10 border-green-500/30 text-green-400' :
                    sysStatus === 'offline' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                    'bg-gray-800/50 border-gray-700 text-gray-500'
                }`}>
                    <div className={`w-2 h-2 rounded-full ${
                        sysStatus === 'online' ? 'bg-green-500 animate-pulse' :
                        sysStatus === 'offline' ? 'bg-red-500' :
                        'bg-gray-500'
                    }`}></div>
                    <span className="text-xs font-bold uppercase tracking-wider">
                        {sysStatus === 'online' ? 'System Online' : 
                         sysStatus === 'offline' ? 'System Offline' : 'Connecting...'}
                    </span>
                </div>
            </div>

            {/* --- SUPER ADMIN BUTTON: FIXED TOP RIGHT --- */}
            <div className="fixed top-6 right-6 z-50">
                <button 
                    onClick={() => window.location.hash = '#/owner/login'}
                    className="flex items-center gap-3 bg-gray-900/90 hover:bg-black border border-gray-700 hover:border-red-500/50 px-4 py-2 rounded-full transition-all duration-300 group shadow-lg backdrop-blur-md"
                >
                    <div className="bg-gray-800 group-hover:bg-red-900/30 p-1.5 rounded-full transition-colors border border-gray-700 group-hover:border-red-500/30">
                        <LockIcon className="h-3 w-3 text-gray-400 group-hover:text-red-400" />
                    </div>
                    <div className="text-left leading-tight">
                        <span className="block text-[10px] text-gray-500 font-bold uppercase tracking-wider">Owner</span>
                        <span className="block text-xs font-bold text-gray-300 group-hover:text-white">Restricted Login</span>
                    </div>
                </button>
            </div>

            {/* --- MAIN CONTENT: CENTERED --- */}
            <div className="relative z-10 w-full max-w-lg p-6">
                
                <div className="text-center mb-10 animate-fade-in-up">
                    <h1 className="text-6xl font-extrabold text-white mb-4 tracking-tighter">
                        GYM <span className="text-primary">KHATA</span>
                    </h1>
                    <p className="text-gray-400 text-xl font-light">
                        Next-Gen Gym Management
                    </p>
                </div>

                <div className="bg-surface/80 backdrop-blur-xl border border-gray-700 rounded-2xl shadow-2xl p-8 animate-fade-in-up delay-75">
                    <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-700/50">
                        <div className="bg-gradient-to-br from-primary to-primary-hover p-4 rounded-xl shadow-lg shadow-primary/20">
                             <UserIcon className="h-8 w-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">Gym Portal</h2>
                            <p className="text-sm text-gray-400">Login to your gym instance</p>
                        </div>
                    </div>

                    <form onSubmit={handleGo} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                Gym ID
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-mono text-lg select-none">/g/</span>
                                <input 
                                    value={inputSlug}
                                    onChange={(e) => { setInputSlug(e.target.value); setError(''); }}
                                    placeholder="your-gym-name"
                                    className="w-full bg-black/50 border border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-4 pl-12 pr-4 text-white outline-none transition-all placeholder-gray-600 font-medium font-mono text-lg"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                                Password
                            </label>
                            <input 
                                type="password"
                                value={password}
                                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                                placeholder="••••••••"
                                className="w-full bg-black/50 border border-gray-600 focus:border-primary focus:ring-1 focus:ring-primary rounded-xl py-4 px-4 text-white outline-none transition-all placeholder-gray-600 font-medium text-lg"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center gap-3 animate-fade-in">
                                <WarningIcon className="h-5 w-5 text-red-400 flex-shrink-0" />
                                <p className="text-red-400 text-sm font-bold">{error}</p>
                            </div>
                        )}

                        <button disabled={loading} className="w-full bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all active:translate-y-0 active:shadow-sm text-lg disabled:opacity-50">
                            {loading ? 'Verifying...' : 'Access Dashboard'}
                        </button>
                    </form>
                </div>
                
                <p className="text-center text-gray-600 text-xs mt-10">
                    &copy; 2026 GYM KHATA SaaS.
                </p>
            </div>
        </div>
    );
};

export default Landing;
