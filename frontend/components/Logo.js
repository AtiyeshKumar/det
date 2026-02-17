"use client";

export default function Logo() {
    return (
        <div className="relative flex items-center justify-center w-10 h-10">
            <svg
                className="w-8 h-8"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="shield-gradient" x1="12" y1="2" x2="12" y2="22" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#1e3a8a" /> {/* Cobalt Blue */}
                        <stop offset="1" stopColor="#3b82f6" /> {/* Lighter Blue */}
                    </linearGradient>
                    <linearGradient id="glass-gradient" x1="12" y1="8" x2="16" y2="12" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#a5f3fc" stopOpacity="0.4" />
                        <stop offset="1" stopColor="#bae6fd" stopOpacity="0.1" />
                    </linearGradient>
                </defs>

                {/* Shield Body */}
                <path
                    d="M12 2L4 5V11C4 16.52 7.4 21.47 12 22C16.6 21.47 20 16.52 20 11V5L12 2Z"
                    fill="url(#shield-gradient)"
                    stroke="#60a5fa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {/* Magnifying Glass Handle */}
                <path
                    d="M14.5 14.5L16.5 16.5"
                    stroke="#cbd5e1"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                />

                {/* Magnifying Glass Rim */}
                <circle
                    cx="11"
                    cy="11"
                    r="4"
                    stroke="#e2e8f0"
                    strokeWidth="2"
                />

                {/* Glass Lens Reflection */}
                <circle
                    cx="11"
                    cy="11"
                    r="4"
                    fill="url(#glass-gradient)"
                />
            </svg>
        </div>
    );
}
