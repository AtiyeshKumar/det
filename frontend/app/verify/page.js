"use client";
import { useState, useRef, useEffect } from "react";

import { useSession, signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";

export default function TruthDetector() {
  const { data: session, status } = useSession();
  const [textClaim, setTextClaim] = useState("");
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null); // Store the actual file
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Audio Refs
  const successRef = useRef(null);
  const alertRef = useRef(null);

  // Initialize Audio on Client
  useEffect(() => {
    successRef.current = new Audio('/sounds/success.mp3');
    alertRef.current = new Audio('/sounds/alert.mp3');

    // Optional: Preload
    successRef.current.load();
    alertRef.current.load();
  }, []);

  // Hidden input reference for when users click instead of drag
  const fileInputRef = useRef(null);

  // --- Auth Check ---
  if (status === "loading") {
    return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">Loading...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center py-12 px-4 text-center">
        <div className="max-w-md w-full bg-slate-800/50 backdrop-blur-md p-8 rounded-2xl border border-white/10 shadow-2xl">
          <div className="mb-6 flex justify-center">
            <div className="bg-blue-500/10 p-4 rounded-full">
              <svg className="w-12 h-12 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Access Restricted</h1>
          <p className="text-gray-400 mb-8">Please sign in to access the advanced AI Truth Detector tools.</p>
          <button
            onClick={() => signIn("google")}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-blue-900/20"
          >
            Sign in with Google
          </button>
        </div>
      </main>
    );
  }

  // --- Drag and Drop Handlers ---
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true); // Triggers the Tailwind color change
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false); // Reverts the color
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    // Grab the dropped file
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      // Create a temporary URL to preview the image on the screen
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageFile(file);
      setResult(null); // Reset previous result
    }
  };

  // --- Click to Upload Handler ---
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setImageFile(file);
      setResult(null); // Reset previous result
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setImageFile(null);
    setResult(null);
  }

  // --- Analyze Handler ---
  const handleAnalyze = async () => {
    if (!textClaim && !imageFile) return;

    setIsLoading(true);
    setResult(null);

    const formData = new FormData();
    if (textClaim) formData.append("text", textClaim);
    if (imageFile) formData.append("file", imageFile);

    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
      setResult(data);

      // Play Sound Feedback using Refs (Always On)
      if (data.label === "REAL") {
        try { successRef.current?.play(); } catch (e) { /* Ignore autoplay errors */ }
      } else {
        try { alertRef.current?.play(); } catch (e) { /* Ignore autoplay errors */ }
      }
    } catch (error) {
      console.error("Error analyzing:", error);
      alert("Failed to analyze. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center py-12 px-4">
      <div className="max-w-3xl w-full bg-slate-800/40 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/5">
        <h1 className="text-4xl font-extrabold text-center text-white mb-2 tracking-tight">Truth Detector AI</h1>
        <p className="text-center text-slate-400 mb-10 text-lg">Upload evidence to verify authenticity with military-grade AI.</p>

        {/* Text Input */}
        <div className="mb-8 group">
          <label className="block text-sm font-medium text-slate-300 mb-3 ml-1 uppercase tracking-wider">Claim / Text Context</label>
          <textarea
            className="w-full p-5 bg-slate-900/50 border border-slate-700 rounded-2xl text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none shadow-inner"
            rows={3}
            placeholder="Paste a suspicious headline, tweet, or claim here..."
            value={textClaim}
            onChange={(e) => setTextClaim(e.target.value)}
          />
        </div>

        {/* Drag and Drop Zone */}
        <div className="mb-8">
          <label className="block text-sm font-medium text-slate-300 mb-3 ml-1 uppercase tracking-wider">Visual Evidence</label>

          <motion.div
            whileHover={{ scale: 1.02, borderColor: "#22d3ee" }} // Neon Cyan
            whileTap={{ scale: 0.98 }}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 overflow-hidden group
              ${isDragging ? "border-cyan-500 bg-cyan-500/10" : "border-slate-700 bg-slate-800/30"}
            `}
          >
            {/* Image Preview Overlay */}
            {imagePreview ? (
              <div className="relative w-full h-full">
                <img
                  src={imagePreview}
                  alt="Uploaded evidence"
                  className="absolute inset-0 w-full h-full object-contain bg-black/40 backdrop-blur-sm p-4"
                />

                {/* Scanning Animation Overlay */}
                {isLoading && (
                  <motion.div
                    className="absolute left-0 w-full h-1 bg-cyan-400 blur-[4px] shadow-[0_0_15px_rgba(34,211,238,0.8)] z-10"
                    initial={{ top: "0%" }}
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-500 group-hover:text-cyan-400 transition-colors">
                <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <p className="mb-2 text-lg font-medium">Drop screenshot or click to upload</p>
                <p className="text-sm opacity-70">Support for PNG, JPG, WEBP</p>
              </div>
            )}

            {/* Hidden Input File Element */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleFileSelect}
            />
          </motion.div>

          {/* Remove Image Button */}
          {imagePreview && !isLoading && (
            <button
              onClick={removeImage}
              className="mt-3 text-sm text-red-400 hover:text-red-300 font-medium transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
              Remove Image
            </button>
          )}
        </div>

        {/* Submit Button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          animate={isLoading ? {
            boxShadow: ["0 0 0px rgba(59, 130, 246, 0)", "0 0 20px rgba(59, 130, 246, 0.5)", "0 0 0px rgba(59, 130, 246, 0)"],
            transition: { duration: 1.5, repeat: Infinity }
          } : {}}
          onClick={handleAnalyze}
          disabled={isLoading || (!textClaim && !imageFile)}
          className={`w-full font-bold py-5 rounded-xl shadow-lg transition-colors text-lg uppercase tracking-wide
            ${isLoading || (!textClaim && !imageFile)
              ? "bg-slate-700 text-slate-500 cursor-not-allowed border border-slate-600"
              : "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white shadow-blue-900/40"
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Searching Live Web...
            </span>
          ) : "Analyze Evidence"}
        </motion.button>

        {/* Result Card */}
        {/* Tactical Alert Overlay */}
        <AnimatePresence>
          {result && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 100, damping: 15 }}
                className={`relative w-full max-w-5xl aspect-video overflow-hidden rounded-3xl border-2 flex flex-col shadow-2xl bg-noise
                  ${result.label === "REAL"
                    ? "bg-slate-900 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.3)]"
                    : "bg-slate-900 border-red-500 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                  }
                `}
              >
                {/* Header / Status Bar */}
                <div className={`p-1 h-3 w-full animate-pulse ${result.label === "REAL" ? "bg-gradient-to-r from-emerald-400 to-green-500" : "bg-gradient-to-r from-red-500 to-orange-600"}`}></div>

                {/* Close Button */}
                <button
                  onClick={() => setResult(null)}
                  className="absolute top-6 right-6 text-slate-300 hover:text-white transition-colors bg-black/40 hover:bg-black/60 p-2 rounded-full backdrop-blur-md z-30 border border-white/10"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>

                <div className="flex-1 p-8 md:p-12 flex flex-col overflow-hidden relative z-20">
                  <div className="flex justify-between items-start mb-6 flex-shrink-0">
                    <div>
                      <h2 className={`text-6xl font-black mb-2 tracking-tighter ${result.label === "REAL" ? "text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.8)]" : "text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.8)]"}`}>
                        {result.label}
                      </h2>
                      <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] opacity-80 font-mono">System Verdict // ID: {result.id || "0000"}</p>
                    </div>
                    <div className={`hidden md:flex p-4 rounded-full border ${result.label === "REAL" ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-red-500/10 border-red-500/30 text-red-500"}`}>
                      {result.label === "REAL" ? (
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      ) : (
                        <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                      )}
                    </div>
                  </div>

                  {/* Confidence Bar */}
                  <div className="mb-6 flex-shrink-0">
                    <div className="flex justify-between text-sm font-semibold text-slate-300 mb-2 font-mono">
                      <span>CONFIDENCE_SCORE</span>
                      <span>{(result.fake_probability * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-4 overflow-hidden border border-white/10">
                      <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: `${result.fake_probability * 100}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                        className={`h-full ${result.label === "REAL" ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"}`}
                      ></motion.div>
                    </div>
                  </div>

                  {/* AI Reasoning Section - Digital Readout */}
                  <div className="flex-1 min-h-0 bg-black/40 rounded-xl border border-white/10 p-6 overflow-y-auto custom-scrollbar shadow-inner">
                    <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 font-mono border-b border-white/5 pb-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                      AI_INVESTIGATION_LOG
                    </h3>
                    <p className="text-slate-200 text-base leading-relaxed font-mono whitespace-pre-line">
                      {result.reasoning || "No detailed reasoning provided."}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-black/60 border-t border-white/10 flex justify-between items-center text-[10px] text-slate-500 font-mono uppercase tracking-wider relative z-20">
                  <span>SECURE_CONNECTION: VERIFIED</span>
                  <span>TRUTH DETECTOR AI v2.0</span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </main>
  );
}