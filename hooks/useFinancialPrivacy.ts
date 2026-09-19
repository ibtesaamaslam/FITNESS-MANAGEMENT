import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY_PASSWORD = 'gymFinancialPassword';

export const useFinancialPrivacy = () => {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalMode, setModalMode] = useState<'set_password' | 'unlock' | 'change_password'>('set_password');

  const [financialPassword, setFinancialPassword] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_PASSWORD);
      if (!stored || stored === 'admin') {
        return '';
      }
      return stored;
    } catch {
      return '';
    }
  });

  const hasPassword = Boolean(financialPassword && financialPassword.trim().length > 0);

  useEffect(() => {
    try {
      if (financialPassword) {
        localStorage.setItem(STORAGE_KEY_PASSWORD, financialPassword);
      } else {
        localStorage.removeItem(STORAGE_KEY_PASSWORD);
      }
    } catch (error) {
      console.error('Failed to save financial password to localStorage', error);
    }
  }, [financialPassword]);

  const lockFinancials = useCallback(() => {
    setIsUnlocked(false);
  }, []);

  const openUnlockModal = useCallback(() => {
    if (!financialPassword || financialPassword.trim().length === 0) {
      setModalMode('set_password');
    } else {
      setModalMode('unlock');
    }
    setIsModalOpen(true);
  }, [financialPassword]);

  const openChangePasswordModal = useCallback(() => {
    if (!financialPassword || financialPassword.trim().length === 0) {
      setModalMode('set_password');
    } else {
      setModalMode('change_password');
    }
    setIsModalOpen(true);
  }, [financialPassword]);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const verifyAndUnlock = useCallback((inputPassword: string): boolean => {
    if (financialPassword && inputPassword === financialPassword) {
      setIsUnlocked(true);
      setIsModalOpen(false);
      return true;
    }
    return false;
  }, [financialPassword]);

  const setInitialPassword = useCallback((newPass: string): { success: boolean; message: string } => {
    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'Password must be at least 3 characters long.' };
    }
    setFinancialPassword(newPass.trim());
    setIsUnlocked(true);
    setIsModalOpen(false);
    return { success: true, message: 'Owner password set successfully.' };
  }, []);

  const changePassword = useCallback((currentPass: string, newPass: string): { success: boolean; message: string } => {
    if (currentPass !== financialPassword) {
      return { success: false, message: 'Current password does not match.' };
    }
    if (!newPass || newPass.trim().length < 3) {
      return { success: false, message: 'New password must be at least 3 characters long.' };
    }
    setFinancialPassword(newPass.trim());
    setIsModalOpen(false);
    return { success: true, message: 'Financial password updated successfully.' };
  }, [financialPassword]);

  return {
    isUnlocked,
    isModalOpen,
    modalMode,
    financialPassword,
    hasPassword,
    lockFinancials,
    openUnlockModal,
    openChangePasswordModal,
    closeModal,
    verifyAndUnlock,
    setInitialPassword,
    changePassword,
    setModalMode,
  };
};

