"use client";

import { useTheme } from "@/app/context/ThemeContext";

export default function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative p-2 rounded-xl transition-all duration-300 ease-in-out
        glass-panel hover:bg-white/30 dark:hover:bg-black/30
        focus:outline-none focus:ring-2 focus:ring-emerald-500/50
      `}
            aria-label="Toggle Theme"
        >
            <div className="relative w-6 h-6 overflow-hidden">
                {/* Sun Icon */}
                <svg
                    className={`
            absolute inset-0 w-6 h-6 text-orange-500 transform transition-transform duration-500
            ${theme === "dark" ? "rotate-90 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"}
          `}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>

                {/* Moon Icon */}
                <svg
                    className={`
            absolute inset-0 w-6 h-6 text-green-400 transform transition-transform duration-500
            ${theme === "light" ? "-rotate-90 opacity-0 scale-50" : "rotate-0 opacity-100 scale-100"}
          `}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            </div>
        </button>
    );
}
