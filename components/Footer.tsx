
import React from 'react';
import { APP_NAME, APP_DOMAIN } from '../constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-100 text-slate-600 py-8 mt-12 md:mt-16 border-t border-slate-200">
      <div className="w-full max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm">
          &copy; {currentYear} {APP_NAME} por <a href={`https://${APP_DOMAIN}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-sky-600 hover:text-sky-700">{APP_DOMAIN}</a>.
        </p>
        <p className="text-xs mt-1">Todos os direitos reservados.</p>
      </div>
    </footer>
  );
};

export default Footer;