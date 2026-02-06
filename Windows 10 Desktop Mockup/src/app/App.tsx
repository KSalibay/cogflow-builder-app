import { Monitor, Trash2, FolderOpen, File } from 'lucide-react';
import { DesktopIcon } from './components/DesktopIcon';
import { Taskbar } from './components/Taskbar';

export default function App() {
  const handleIconClick = (name: string) => {
    console.log(`${name} clicked`);
  };

  return (
    <div 
      className="w-full h-screen relative overflow-hidden"
      style={{
        backgroundImage: 'url(https://images.unsplash.com/photo-1679269241012-f7640862d242?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kb3dzJTIwZGVza3RvcCUyMHdhbGxwYXBlciUyMGJsdWV8ZW58MXx8fHwxNzcwNDc0MDU4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      {/* Desktop Icons */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <DesktopIcon 
          icon={Monitor} 
          label="This PC" 
          onClick={() => handleIconClick('This PC')}
        />
        <DesktopIcon 
          icon={FolderOpen} 
          label="Documents" 
          onClick={() => handleIconClick('Documents')}
        />
        <DesktopIcon 
          icon={File} 
          label="My File" 
          onClick={() => handleIconClick('My File')}
        />
        <DesktopIcon 
          icon={Trash2} 
          label="Recycle Bin" 
          onClick={() => handleIconClick('Recycle Bin')}
        />
      </div>

      {/* Taskbar */}
      <Taskbar />
    </div>
  );
}
