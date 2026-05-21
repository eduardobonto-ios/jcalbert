import React from 'react';

interface HeaderProps {
  onLogoClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogoClick }) => {
  return (
    <header className="w-full py-4 px-4 md:px-8">
      <div className="max-w-7xl mx-auto flex items-center">
        <button 
          onClick={onLogoClick}
          className="flex items-center justify-center rounded-full bg-white p-1.5 shadow-xl ring-4 ring-white/80 transition-all hover:scale-105 hover:shadow-2xl"
          aria-label="Jcalbert Travel & Tours Services"
        >
          <img
            src="/images/tours/jcalbert_logo.jpg"
            alt="Jcalbert Travel & Tours Services logo"
            className="h-20 w-20 rounded-full object-cover md:h-24 md:w-24"
          />
        </button>
      </div>
    </header>
  );
};
