import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from './ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative flex items-center justify-between w-20 h-10 p-1 bg-slate-100 dark:bg-slate-800 rounded-full transition-colors duration-300 focus:outline-none overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner group"
      aria-label="Toggle theme"
    >
      {/* Background patterns */}
      <div className="absolute inset-0 opacity-10 dark:opacity-0 transition-opacity">
        <Sun className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
      </div>
      <div className="absolute inset-0 opacity-0 dark:opacity-10 transition-opacity">
        <Moon className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary" />
      </div>

      {/* Toggle Knob */}
      <motion.div
        className="relative z-10 w-8 h-8 flex items-center justify-center bg-white dark:bg-primary rounded-full shadow-lg border border-slate-200 dark:border-white/10"
        animate={{
          x: theme === 'light' ? 0 : 40,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30,
        }}
      >
        {theme === 'light' ? (
          <Sun className="w-5 h-5 text-amber-500" />
        ) : (
          <Moon className="w-5 h-5 text-secondary" />
        )}
      </motion.div>

      {/* Static Icons */}
      <div className="flex-1 flex justify-around items-center px-1">
        <Moon className={`w-4 h-4 transition-all duration-300 ${theme === 'dark' ? 'opacity-0 scale-50' : 'text-slate-400 group-hover:text-primary'}`} />
        <Sun className={`w-4 h-4 transition-all duration-300 ${theme === 'light' ? 'opacity-0 scale-50' : 'text-slate-400 group-hover:text-secondary'}`} />
      </div>
    </button>
  );
};

export default ThemeToggle;
