
import React from 'react';
import { Gym } from '../types';
import { LockIcon, WarningIcon, CreditCardIcon } from './icons';

interface Props {
  gym: Gym;
  children: React.ReactNode;
  onNavigateToBilling: () => void;
  isOwnerView?: boolean;
  allowInteraction?: boolean;
}

const SubscriptionGuard: React.FC<Props> = ({ gym, children, onNavigateToBilling, isOwnerView = false, allowInteraction = false }) => {
  const { subscriptionStatus } = gym;

  if (isOwnerView) return <>{children}</>;

  // BLOCKING STATES
  if (subscriptionStatus === 'suspended' || subscriptionStatus === 'cancelled') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="bg-red-500/20 p-6 rounded-full mb-6">
          <LockIcon className="h-16 w-16 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Suspended</h1>
        <p className="text-text-secondary mb-8 max-w-md">
          {subscriptionStatus === 'cancelled' 
            ? 'This account has been cancelled. Please reactivate your subscription to access your data.' 
            : 'We were unable to process your recent payment. Please update your billing information.'}
        </p>
        <button 
          onClick={onNavigateToBilling}
          className="bg-primary hover:bg-primary-hover text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2"
        >
          <CreditCardIcon className="h-5 w-5" />
          Manage Subscription
        </button>
      </div>
    );
  }

  // WARNING STATES (Non-blocking but visible)
  if (subscriptionStatus === 'past_due') {
    return (
      <div className="flex flex-col h-full relative">
        <div className="bg-yellow-600 text-white px-4 py-2 flex justify-between items-center text-sm shadow-md z-10 shrink-0">
          <div className="flex items-center gap-2">
            <WarningIcon className="h-4 w-4" />
            <span className="font-bold">Payment Past Due</span>
            <span className="hidden sm:inline">- Features are limited. Please update payment method.</span>
          </div>
          <button onClick={onNavigateToBilling} className="bg-white text-yellow-800 text-xs font-bold px-3 py-1 rounded">
            Fix Now
          </button>
        </div>
        <div className={`flex-1 overflow-auto relative ${!allowInteraction ? 'opacity-75 pointer-events-none select-none grayscale' : ''}`}>
             {!allowInteraction && <div className="absolute inset-0 z-20 bg-transparent"></div>}
             <div className="h-full">
                {children}
             </div>
        </div>
      </div>
    );
  }

  // TRIAL
  if (subscriptionStatus === 'trial') {
    const daysLeft = Math.ceil((new Date(gym.trialEndsAt).getTime() - new Date().getTime()) / (86400000));
    return (
      <div className="flex flex-col h-full">
        <div className="bg-indigo-600 text-white px-4 py-1 flex justify-between items-center text-xs shrink-0">
          <span>Trial Account: <b>{daysLeft} days left</b>.</span>
          <button onClick={onNavigateToBilling} className="underline hover:text-indigo-200">Upgrade Now</button>
        </div>
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default SubscriptionGuard;
