import React, { useState } from 'react';
import { Role } from '../types';
import { LockIcon } from './icons';

interface LoginProps {
    onLogin: (role: Role) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [role, setRole] = useState<Role>('Admin');
    const [password, setPassword] = useState('');
    const [regNo, setRegNo] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (role === 'Admin') {
            if (password === 'admin123') {
                onLogin('Admin');
            } else {
                setError('Invalid password. Try "admin123"');
            }
        } else if (role === 'Manager') {
            if (password === 'manager123') {
                onLogin('Manager');
            } else {
                setError('Invalid password. Try "manager123"');
            }
        } else if (role === 'Member') {
            if (regNo.trim().length > 0) {
                onLogin('Member');
            } else {
                setError('Please enter a Registration Number');
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <div className="bg-primary/20 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                        <LockIcon className="h-10 w-10 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold text-text-primary">Saqib Fitness</h1>
                    <p className="text-text-secondary mt-2">Gym Management System</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-text-secondary mb-2">Select Role</label>
                        <div className="grid grid-cols-3 gap-2 bg-secondary p-1 rounded-lg">
                            {(['Admin', 'Manager', 'Member'] as Role[]).map((r) => (
                                <button
                                    key={r}
                                    type="button"
                                    onClick={() => { setRole(r); setError(''); setPassword(''); setRegNo(''); }}
                                    className={`py-2 text-sm font-medium rounded-md transition-colors ${
                                        role === r ? 'bg-primary text-white shadow' : 'text-text-secondary hover:text-text-primary'
                                    }`}
                                >
                                    {r}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(role === 'Admin' || role === 'Manager') && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="Enter password"
                            />
                            <p className="text-xs text-text-secondary mt-2">Hint: {role === 'Admin' ? 'admin123' : 'manager123'}</p>
                        </div>
                    )}

                    {role === 'Member' && (
                        <div>
                            <label className="block text-sm font-medium text-text-secondary mb-2">Registration Number</label>
                            <input
                                type="text"
                                value={regNo}
                                onChange={(e) => setRegNo(e.target.value)}
                                className="w-full p-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                placeholder="e.g. SF-001"
                            />
                        </div>
                    )}

                    {error && (
                        <div className="text-red-400 text-sm text-center bg-red-400/10 p-2 rounded-lg">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;