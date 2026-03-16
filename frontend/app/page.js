"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [stats, setStats] = useState({
    total_articles_analyzed: 0,
    total_community_votes: 0,
    agreements: 0,
    disagreements: 0,
  });

  useEffect(() => {
    // Fetch live stats from your FastAPI database
    const fetchStats = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/stats`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  // Calculate the community agreement percentage
  const agreementRate = stats.total_community_votes > 0 
    ? Math.round((stats.agreements / stats.total_community_votes) * 100) 
    : 0;

  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center p-6 text-white w-full">
      
      {/* Hero Section */}
      <div className="text-center max-w-4xl mb-12 mt-8">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-white">
          Decentralized <span className="text-blue-500">AI Truth Detector</span>
        </h1>
        <p className="text-xl text-gray-400 mb-10">
          Verify news with the power of Artificial Intelligence, backed by real community consensus.
        </p>
        <button
          onClick={() => router.push("/verify")}
          className="px-10 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition duration-200 text-lg shadow-lg"
        >
          🔍 Start Verifying News
        </button>
      </div>

      {/* Live Stats Dashboard */}
      <div className="w-full max-w-4xl bg-gray-900 border border-gray-800 p-8 rounded-2xl shadow-2xl">
        <h2 className="text-2xl font-bold mb-8 text-center text-gray-300">
          📊 Live Platform Statistics
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Stat Box 1 */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center flex flex-col justify-center">
            <p className="text-gray-400 font-medium mb-2">Articles Analyzed</p>
            <p className="text-5xl font-black text-blue-400">{stats.total_articles_analyzed}</p>
          </div>

          {/* Stat Box 2 */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center flex flex-col justify-center">
            <p className="text-gray-400 font-medium mb-2">Community Votes</p>
            <p className="text-5xl font-black text-purple-400">{stats.total_community_votes}</p>
          </div>

          {/* Stat Box 3 */}
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 text-center flex flex-col justify-center">
            <p className="text-gray-400 font-medium mb-2">Community Trust</p>
            <p className="text-5xl font-black text-green-400">{agreementRate}%</p>
          </div>
        </div>
      </div>

    </div>
  );
}