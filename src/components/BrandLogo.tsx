import React from 'react';

interface BrandLogoProps {
  className?: string;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({ className = 'w-9 h-9' }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Modular facade frame */}
      <rect
        x="3"
        y="3"
        width="34"
        height="34"
        rx="9"
        fill="#176FAF"
        stroke="#82C5EF"
        strokeWidth="1.5"
      />
      {/* Facade grid dividers */}
      <line x1="15" y1="3" x2="15" y2="37" stroke="#429EDB" strokeWidth="1" strokeOpacity="0.45" />
      <line x1="25" y1="3" x2="25" y2="37" stroke="#429EDB" strokeWidth="1" strokeOpacity="0.45" />
      <line x1="3" y1="20" x2="37" y2="20" stroke="#429EDB" strokeWidth="1" strokeOpacity="0.45" />
      {/* Coconut coir fibrous mesh accent */}
      <path
        d="M9 12.5C12.5 10 17.5 15 21 12.5C24.5 10 28.5 14 31 12"
        stroke="#D7B978"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M9 28C13 25.5 17 30 21 27.5C25 25 28 28.5 31 27"
        stroke="#72B89A"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {/* Clean air flow stream */}
      <path
        d="M8 20H29M29 20L24.5 15.8M29 20L24.5 24.2"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
