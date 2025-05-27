
import React, { useState, useEffect, useRef } from 'react';
import { APP_NAME } from '../constants';
import { User } from '../types';

interface HeaderProps {
  user: User | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onMyProfileClick?: () => void; 
  onMySubscriptionClick?: () => void;
  onMyActivitiesClick: () => void; // Made mandatory
}

const Header: React.FC<HeaderProps> = ({ 
    user, 
    onLoginClick, 
    onLogoutClick,
    onMyProfileClick = () => console.log("Meu Perfil clicked"),
    onMySubscriptionClick = () => console.log("Minha Assinatura clicked"),
    onMyActivitiesClick // Now mandatory
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleMyActivities = (e: React.MouseEvent) => {
    e.preventDefault();
    onMyActivitiesClick();
    setIsDropdownOpen(false);
  };

  return (
    <header className="bg-white text-slate-800 shadow-md border-b border-slate-200 sticky top-0 z-40">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex justify-between items-center">
        <div className="flex items-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 sm:h-10 sm:w-10 mr-2 sm:mr-3 text-sky-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v2h-2v-2zm0 4h2v6h-2v-6z"/>
            <path d="M12.0001 11.1667L12 11.1667C11.7763 11.1703 11.5574 11.2628 11.3917 11.426C11.2259 11.5892 11.1254 11.8066 11.1112 12.0303L11.1108 12.0635L10.043 17.3968C10.0303 17.4592 10.0303 17.5225 10.043 17.5849C10.0682 17.7074 10.1354 17.8147 10.2303 17.8896C10.3252 17.9646 10.4407 18.0021 10.5596 17.9952H13.4405C13.5594 18.0021 13.6749 17.9646 13.7698 17.8896C13.8647 17.8147 13.9319 17.7074 13.9568 17.5849L14.8893 12.0635L14.8897 12.0303C14.8755 11.8066 14.775 11.5892 14.6092 11.426C14.4435 11.2628 14.2246 11.1703 14.0009 11.1667H12.0001ZM7.50008 7.83333H9.00008V9.33333H7.50008V7.83333ZM15.0001 7.83333H16.5001V9.33333H15.0001V7.83333Z" />
            <path d="M5.67188 13.0498L7.21407 10.2219C7.32397 10.0269 7.5396 9.9165 7.77301 9.9165H9.3072L8.37849 11.5498L5.67188 13.0498Z" />
            <path d="M18.3282 13.0498L16.786 10.2219C16.6761 10.0269 16.4605 9.9165 16.2271 9.9165H14.6929L15.6216 11.5498L18.3282 13.0498Z" />
           </svg>
          <a href="#" onClick={(e) => { e.preventDefault(); onMyActivitiesClick(); }} className="text-xl sm:text-2xl font-bold tracking-tight text-sky-700 hover:text-sky-800">{APP_NAME}</a>
        </div>
        <div className="flex items-center space-x-3 sm:space-x-4">
          {user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center text-xs sm:text-sm font-medium text-slate-700 hover:text-sky-600 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={isDropdownOpen}
              >
                <span className="truncate max-w-[100px] sm:max-w-[150px] md:max-w-xs">{user.email}</span>
                <svg className={`w-4 h-4 ml-1 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-slate-200">
                  <a
                    href="#profile"
                    onClick={(e) => { e.preventDefault(); onMyProfileClick(); setIsDropdownOpen(false); }}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-sky-600"
                  >
                    Meu Perfil
                  </a>
                  <a
                    href="#subscription"
                    onClick={(e) => { e.preventDefault(); onMySubscriptionClick(); setIsDropdownOpen(false); }}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-sky-600"
                  >
                    Minha Assinatura
                  </a>
                  <a
                    href="#my-activities"
                    onClick={handleMyActivities}
                    className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-sky-600"
                  >
                    Minhas Atividades
                  </a>
                  <div className="border-t border-slate-200 my-1"></div>
                  <button
                    onClick={() => { onLogoutClick(); setIsDropdownOpen(false); }}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    Sair
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="text-xs sm:text-sm font-medium text-sky-700 bg-sky-100 hover:bg-sky-200 px-3 py-2 rounded-md"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
