import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { LockIcon } from './icons';

interface LoginProps {
    onLogin: (role: Role) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [role, setRole] = useState<Role>('Admin');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [regNo, setRegNo] = useState('');
    const [error, setError] = useState('');
    
    // Setup mode is true if no password is saved in localStorage for the selected role
    const [isSetupMode, setIsSetupMode] = useState(false);

    useEffect(() => {
        // Reset state on role change
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setRegNo('');
        setError('');

        if (role === 'Admin') {
            const stored = localStorage.getItem('gym_auth_admin');
            setIsSetupMode(!stored);
        } else if (role === 'Manager') {
            const stored = localStorage.getItem('gym_auth_manager');
            setIsSetupMode(!stored);
        } else {
            setIsSetupMode(false);
        }
    }, [role]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (role === 'Member') {
            if (regNo.trim().length > 0) {
                onLogin('Member');
            } else {
                setError('Please enter a Registration Number');
            }
            return;
        }

        if (isSetupMode) {
            // First time setup logic
            if (newPassword.length < 4) {
                setError('Password is too short (min 4 chars)');
                return;
            }
            if (newPassword !== confirmPassword) {
                setError('Passwords do not match');
                return;
            }

            try {
                const key = role === 'Admin' ? 'gym_auth_admin' : 'gym_auth_manager';
                localStorage.setItem(key, newPassword);
                onLogin(role);
            } catch (err) {
                setError('Failed to save password. Local storage might be restricted.');
            }
        } else {
            // Normal login logic
            const key = role === 'Admin' ? 'gym_auth_admin' : 'gym_auth_manager';
            const stored = localStorage.getItem(key);

            if (stored && password === stored) {
                onLogin(role);
            } else {
                setError('Invalid password');
            }
        }
    };

    // Helper to clear password for demo purposes (Reset mechanism)
    const handleResetPassword = () => {
        if (window.confirm(`Are you sure you want to reset the ${role} password? You will need to set it again.`)) {
            const key = role === 'Admin' ? 'gym_auth_admin' : 'gym_auth_manager';
            localStorage.removeItem(key);
            setIsSetupMode(true);
            setError('');
            alert('Password reset. Please set a new password.');
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
                                    onClick={() => setRole(r)}
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
                        <div className="space-y-4">
                            {isSetupMode ? (
                                <div className="animate-fade-in-up">
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg text-sm text-blue-200 mb-4">
                                        <strong>Welcome!</strong> Please set a password for the {role} account to continue.
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">New Password</label>
                                        <input
                                            type="password"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="w-full p-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="Create password"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full p-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="Confirm password"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in-up">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-text-secondary">Password</label>
                                        <button 
                                            type="button" 
                                            onClick={handleResetPassword}
                                            className="text-xs text-text-secondary hover:text-red-400 transition-colors"
                                        >
                                            Forgot/Reset?
                                        </button>
                                    </div>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full p-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                        placeholder="Enter password"
                                    />
                                </div>
                            )}
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
                        <div className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full bg-primary text-white font-bold py-3 px-4 rounded-lg hover:bg-primary-hover transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {isSetupMode && (role === 'Admin' || role === 'Manager') ? 'Set Password & Login' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;