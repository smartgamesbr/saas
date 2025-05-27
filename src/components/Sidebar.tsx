import React from 'react';
import { User } from '../types';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  DocumentDuplicateIcon,
  UserCircleIcon,
  CreditCardIcon,
  ArrowLeftOnRectangleIcon,
} from '@heroicons/react/24/outline';

interface SidebarProps {
  user: User | null;
  onMyActivitiesClick: () => void;
  onMySubscriptionClick: () => void;
  onMyProfileClick: () => void;
  onLogoutClick: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  onMyActivitiesClick,
  onMySubscriptionClick,
  onMyProfileClick,
  onLogoutClick,
  isOpen,
  onClose,
}) => {
  const sidebarVariants = {
    open: { x: 0, opacity: 1 },
    closed: { x: '-100%', opacity: 0 },
  };

  const menuItems = [
    {
      icon: HomeIcon,
      label: 'Início',
      onClick: onMyActivitiesClick,
    },
    {
      icon: DocumentDuplicateIcon,
      label: 'Minhas Atividades',
      onClick: onMyActivitiesClick,
    },
    {
      icon: CreditCardIcon,
      label: 'Minha Assinatura',
      onClick: onMySubscriptionClick,
    },
    {
      icon: UserCircleIcon,
      label: 'Meu Perfil',
      onClick: onMyProfileClick,
    },
  ];

  if (!user) return null;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <motion.div
        initial="closed"
        animate={isOpen ? 'open' : 'closed'}
        variants={sidebarVariants}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-50 lg:relative lg:z-0 lg:translate-x-0 lg:shadow-none`}
      >
        <div className="flex flex-col h-full">
          {/* User Info */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-primary-700 font-semibold text-lg">
                  {user.email[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {user.email}
                </p>
                <p className="text-xs text-slate-500">
                  {user.isAdmin ? 'Administrador' : user.isSubscribed ? 'Assinante' : 'Usuário Gratuito'}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  item.onClick();
                  onClose();
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <item.icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            ))}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-slate-200">
            <button
              onClick={() => {
                onLogoutClick();
                onClose();
              }}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 rounded-lg hover:bg-red-50 transition-colors"
            >
              <ArrowLeftOnRectangleIcon className="w-5 h-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </motion.div>
    </>
  );
};

export default Sidebar;