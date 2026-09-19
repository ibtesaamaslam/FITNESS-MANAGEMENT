import React, { useState, useEffect } from 'react';
import { Role } from '../types';
import { LockIcon } from './icons';

interface LoginProps {
    onLogin: (role: Role) => void;
    gymName: string;
    onUpdateGymName: (name: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, gymName, onUpdateGymName }) => {
    const [role, setRole] = useState<Role>('Admin');
    const [password, setPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [securityWord, setSecurityWord] = useState('');
    const [regNo, setRegNo] = useState('');
    const [error, setError] = useState('');
    
    // Configurable Gym Name inline editing state
    const [isEditingName, setIsEditingName] = useState(false);
    const [tempName, setTempName] = useState('');
    
    // Setup mode is true if no password is saved in localStorage for the selected role
    const [isSetupMode, setIsSetupMode] = useState(false);
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [showSetupNewPassword, setShowSetupNewPassword] = useState(false);
    const [showSetupConfirmPassword, setShowSetupConfirmPassword] = useState(false);

    // Custom non-blocking Reset Password Dialog State
    const [isResetPopupOpen, setIsResetPopupOpen] = useState(false);
    const [resetWordInput, setResetWordInput] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetSuccess, setResetSuccess] = useState(false);
    const [revealedPassword, setRevealedPassword] = useState('');
    const [isPasswordRevealed, setIsPasswordRevealed] = useState(false);

    const handleSaveName = () => {
        const trimmed = tempName.trim();
        if (trimmed.length > 0) {
            onUpdateGymName(trimmed);
        }
        setIsEditingName(false);
    };

    useEffect(() => {
        // Reset state on role change
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSecurityWord('');
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
            if (!securityWord.trim()) {
                setError('Please enter a security reset word');
                return;
            }

            try {
                const key = role === 'Admin' ? 'gym_auth_admin' : 'gym_auth_manager';
                const wordKey = role === 'Admin' ? 'gym_auth_admin_word' : 'gym_auth_manager_word';
                localStorage.setItem(key, newPassword);
                localStorage.setItem(wordKey, securityWord.trim());
                onLogin(role);
            } catch (err) {
                setError('Failed to save values. Local storage might be restricted.');
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

    // Helper to clear password with Security Word verification (Reset mechanism)
    const handleOpenResetPopup = () => {
        setResetWordInput('');
        setResetError('');
        setResetSuccess(false);
        setRevealedPassword('');
        setIsPasswordRevealed(false);
        setIsResetPopupOpen(true);
    };

    const handleConfirmReset = () => {
        const wordKey = role === 'Admin' ? 'gym_auth_admin_word' : 'gym_auth_manager_word';
        const correctAnswer = localStorage.getItem(wordKey);

        if (correctAnswer) {
            if (!resetWordInput.trim()) {
                setResetError('Please enter the secret recovery word.');
                return;
            }
            if (resetWordInput.trim().toLowerCase() !== correctAnswer.trim().toLowerCase()) {
                setResetError('Incorrect secret recovery word. Reset denied.');
                return;
            }
        }

        setResetSuccess(true);
    };

    const handleRevealOldPassword = () => {
        const key = role === 'Admin' ? 'gym_auth_admin' : 'gym_auth_manager';
        const stored = localStorage.getItem(key) || '(No password configured)';
        setRevealedPassword(stored);
        setIsPasswordRevealed(true);
    };

    const handleProceedToReset = () => {
        const key = role === 'Admin' ? 'gym_auth_admin' : 'gym_auth_manager';
        const wordKey = role === 'Admin' ? 'gym_auth_admin_word' : 'gym_auth_manager_word';
        localStorage.removeItem(key);
        localStorage.removeItem(wordKey);

        setIsResetPopupOpen(false);
        setIsSetupMode(true);
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setSecurityWord('');
        setError('');
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="bg-surface p-8 rounded-lg shadow-2xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-8">
                    <div className="bg-primary/20 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-4">
                        <LockIcon className="h-10 w-10 text-primary" />
                    </div>
                    {isEditingName ? (
                        <div className="flex items-center gap-2 mb-1 justify-center">
                            <input
                                type="text"
                                value={tempName}
                                onChange={(e) => setTempName(e.target.value)}
                                onBlur={handleSaveName}
                                onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                                className="bg-secondary text-text-primary text-center font-bold px-3 py-1.5 rounded-lg border border-primary outline-none text-2xl w-full"
                                autoFocus
                                required
                            />
                        </div>
                    ) : (
                        <div className="relative flex items-center justify-center max-w-xs mx-auto group mb-1">
                            <h1 className="text-3xl font-bold text-text-primary text-center px-8">{gymName}</h1>
                            <button
                                type="button"
                                onClick={() => { setTempName(gymName); setIsEditingName(true); }}
                                className="absolute right-0 p-1.5 hover:bg-secondary rounded-lg text-text-secondary hover:text-text-primary transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                                title="Rename Gym Branding"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </button>
                        </div>
                    )}
                    <p className="text-text-secondary">Gym Management System</p>
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
                                        <div className="relative">
                                            <input
                                                type={showSetupNewPassword ? "text" : "password"}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                className="w-full p-3 pr-16 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="Create password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSetupNewPassword(!showSetupNewPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                                            >
                                                {showSetupNewPassword ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Confirm Password</label>
                                        <div className="relative">
                                            <input
                                                type={showSetupConfirmPassword ? "text" : "password"}
                                                value={confirmPassword}
                                                onChange={(e) => setConfirmPassword(e.target.value)}
                                                className="w-full p-3 pr-16 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                                placeholder="Confirm password"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSetupConfirmPassword(!showSetupConfirmPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                                            >
                                                {showSetupConfirmPassword ? 'Hide' : 'Show'}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">Secret Reset Word (Required for password recovery)</label>
                                        <input
                                            type="text"
                                            value={securityWord}
                                            onChange={(e) => setSecurityWord(e.target.value)}
                                            className="w-full p-3 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="Enter secret word (e.g. AtlasSafe)"
                                            required
                                        />
                                        <p className="text-xs text-text-secondary mt-1">When resetting this password, you must enter this exact word.</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="animate-fade-in-up">
                                    <div className="flex justify-between items-center mb-2">
                                        <label className="block text-sm font-medium text-text-secondary">Password</label>
                                        <button 
                                            type="button" 
                                            onClick={handleOpenResetPopup}
                                            className="text-xs text-text-secondary hover:text-red-400 transition-colors"
                                        >
                                            Forgot/Reset?
                                        </button>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type={showLoginPassword ? "text" : "password"}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full p-3 pr-16 bg-secondary rounded-lg border border-gray-700 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
                                            placeholder="Enter password"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowLoginPassword(!showLoginPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-text-secondary hover:text-text-primary px-2 py-1 rounded bg-surface/80 border border-gray-700/60 hover:bg-secondary transition-colors cursor-pointer"
                                        >
                                            {showLoginPassword ? 'Hide' : 'Show'}
                                        </button>
                                    </div>
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

            {/* Secure custom recovery popup dialog */}
            {isResetPopupOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-surface border border-gray-700 rounded-xl p-6 w-full max-w-sm shadow-2xl relative animate-scale-up">
                        <h2 className="text-xl font-bold text-text-primary mb-3 flex items-center gap-2">
                            <span className="p-1.5 bg-red-500/10 rounded-lg text-red-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </span>
                            Reset {role} Password
                        </h2>

                        {!resetSuccess ? (
                            <div className="space-y-4">
                                {localStorage.getItem(role === 'Admin' ? 'gym_auth_admin_word' : 'gym_auth_manager_word') ? (
                                    <>
                                        <p className="text-xs text-text-secondary leading-relaxed">
                                            A secret recovery word is configured for security. Please enter it below to confirm security reset:
                                        </p>
                                        <div>
                                            <label className="block text-xs font-semibold text-text-secondary mb-1.5">Secret Reset Word</label>
                                            <input
                                                type="text"
                                                value={resetWordInput}
                                                onChange={(e) => setResetWordInput(e.target.value)}
                                                className="w-full p-2.5 bg-secondary text-text-primary rounded-lg border border-gray-700 focus:border-red-400 focus:ring-1 focus:ring-red-400 outline-none transition-all text-sm font-semibold"
                                                placeholder="Enter secret word..."
                                                autoFocus
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-text-secondary leading-relaxed">
                                        No Secret word is registered for this account yet. Are you sure you want to completely reset the {role} access and configure new credentials?
                                    </p>
                                )}

                                {resetError && (
                                    <p className="text-xs text-red-400 font-semibold bg-red-400/10 p-2 rounded border border-red-400/15 text-center select-none">
                                        {resetError}
                                    </p>
                                )}

                                <div className="flex justify-end gap-2.5 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsResetPopupOpen(false)}
                                        className="px-3.5 py-2 text-xs font-bold text-text-secondary hover:text-text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleConfirmReset}
                                        className="px-4 py-2 text-xs font-bold bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors shadow shadow-red-500/10 cursor-pointer"
                                    >
                                        Confirm & Reset
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4 text-center py-2 animate-fade-in">
                                <div className="p-3 bg-green-500/15 rounded-full w-14 h-14 mx-auto flex items-center justify-center text-green-400 animate-bounce">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h3 className="font-bold text-text-primary">Verification Successful!</h3>

                                {!isPasswordRevealed ? (
                                    <>
                                        <p className="text-xs text-text-secondary leading-relaxed mb-2">
                                            Please choose what you would like to do with the {role} login credentials:
                                        </p>
                                        <div className="space-y-2">
                                            <button
                                                type="button"
                                                onClick={handleRevealOldPassword}
                                                className="w-full py-2.5 px-4 text-xs font-bold bg-secondary hover:bg-neutral-800 text-text-primary rounded-lg transition-colors border border-gray-700 flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                See Old Password
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleProceedToReset}
                                                className="w-full py-2.5 px-4 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow flex items-center justify-center gap-2 cursor-pointer"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                                Reset & Create New
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsResetPopupOpen(false)}
                                                className="w-full py-2 text-xs font-bold text-text-secondary hover:text-text-primary transition-colors cursor-pointer"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-4 text-left animate-fade-in mt-2 border border-gray-700/50 bg-secondary/30 p-3 rounded-lg">
                                        <div>
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-wider block mb-1">Current Password Found</span>
                                            <div className="flex items-center justify-between bg-secondary p-2.5 rounded-lg border border-gray-700 font-mono text-base font-bold text-green-400 select-all">
                                                <span>{revealedPassword}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(revealedPassword);
                                                        alert('Password copied to clipboard!');
                                                    }}
                                                    className="p-1 hover:bg-neutral-800 rounded text-text-secondary hover:text-text-primary transition-all cursor-pointer"
                                                    title="Copy Password"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 pt-1">
                                            <button
                                                type="button"
                                                onClick={handleProceedToReset}
                                                className="w-full py-2 text-xs font-bold bg-primary hover:bg-primary-hover text-white rounded-lg transition-colors shadow cursor-pointer text-center"
                                            >
                                                Reset & Create New Anyway
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsResetPopupOpen(false)}
                                                className="w-full py-2 text-xs font-bold text-center text-text-secondary hover:text-text-primary hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                                            >
                                                Done (Close)
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;