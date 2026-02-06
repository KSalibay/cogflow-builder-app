import { Search, Chrome, Folder, Mail, Volume2, Wifi, Battery } from 'lucide-react';
import { useState } from 'react';

export function Taskbar() {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const currentTime = new Date().toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
  const currentDate = new Date().toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit',
    year: 'numeric'
  });

  return (
    <>
      {/* Start Menu */}
      {showStartMenu && (
        <div className="absolute bottom-12 left-0 w-96 h-[500px] bg-gray-900/95 backdrop-blur-md border-t border-gray-700 shadow-2xl">
          <div className="p-6">
            <h3 className="text-white text-sm mb-4">Pinned Apps</h3>
            <div className="grid grid-cols-3 gap-4">
              {['Mail', 'Calendar', 'Photos', 'Store', 'Settings', 'Edge'].map((app) => (
                <div key={app} className="flex flex-col items-center justify-center p-3 hover:bg-gray-700/50 rounded cursor-pointer">
                  <div className="w-12 h-12 bg-blue-500 rounded flex items-center justify-center mb-2">
                    <span className="text-white text-xs">{app[0]}</span>
                  </div>
                  <span className="text-white text-xs text-center">{app}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="absolute bottom-0 left-0 right-0 h-12 bg-gray-900/80 backdrop-blur-md border-t border-gray-700/50 flex items-center px-2 z-10">
        {/* Start Button */}
        <button
          onClick={() => setShowStartMenu(!showStartMenu)}
          className="w-12 h-full flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="currentColor">
            <rect x="3" y="3" width="8" height="8" />
            <rect x="13" y="3" width="8" height="8" />
            <rect x="3" y="13" width="8" height="8" />
            <rect x="13" y="13" width="8" height="8" />
          </svg>
        </button>

        {/* Search Bar */}
        <div className="flex items-center bg-white/10 rounded px-3 py-1.5 ml-2 w-64 hover:bg-white/15 transition-colors cursor-text">
          <Search className="w-4 h-4 text-gray-300 mr-2" />
          <span className="text-gray-300 text-sm">Type here to search</span>
        </div>

        {/* Pinned Apps */}
        <div className="flex items-center ml-4 gap-1">
          <button className="w-10 h-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Chrome className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Folder className="w-5 h-5 text-white" />
          </button>
          <button className="w-10 h-full flex items-center justify-center hover:bg-white/10 transition-colors">
            <Mail className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* System Tray */}
        <div className="ml-auto flex items-center gap-3 mr-2">
          <button className="hover:bg-white/10 p-1.5 rounded transition-colors">
            <Volume2 className="w-4 h-4 text-white" />
          </button>
          <button className="hover:bg-white/10 p-1.5 rounded transition-colors">
            <Wifi className="w-4 h-4 text-white" />
          </button>
          <button className="hover:bg-white/10 p-1.5 rounded transition-colors">
            <Battery className="w-4 h-4 text-white" />
          </button>
          
          {/* Clock */}
          <div className="hover:bg-white/10 px-2 py-1 rounded transition-colors cursor-pointer">
            <div className="text-white text-xs text-right leading-tight">
              <div>{currentTime}</div>
              <div>{currentDate}</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
