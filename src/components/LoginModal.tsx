import React from 'react';
import { AuthModal } from './AuthModal';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  return <AuthModal isOpen={isOpen} onClose={onClose} />;
};
