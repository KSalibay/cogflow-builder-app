import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface DesktopIconProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}

export function DesktopIcon({ icon: Icon, label, onClick }: DesktopIconProps) {
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    setIsSelected(!isSelected);
    onClick?.();
  };

  return (
    <div
      onClick={handleClick}
      className={`flex flex-col items-center justify-center w-20 h-24 cursor-pointer rounded p-1 transition-colors ${
        isSelected ? 'bg-blue-500/30 border border-blue-400/50' : 'hover:bg-white/10'
      }`}
    >
      <Icon className="w-12 h-12 text-white drop-shadow-lg" strokeWidth={1.5} />
      <span className="text-white text-xs mt-1 text-center drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] select-none">
        {label}
      </span>
    </div>
  );
}
