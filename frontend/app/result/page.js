"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("prediction");

    if (!stored) {
      router.push("/verify");
      return;
    }

    setResult(JSON.parse(stored));
  }, [router]);

  if (!result) {
    return (
      <div className="flex items-center justify-center min-h-[85vh] text-white">
        Loading...
      </div>
    );
  }

  const percent = result.confidence_score ?? 0;

  const submitVote = async (userVote) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prediction_id: result.id,
          ai_label: result.label,
          user_vote: userVote,
        }),
      });

      if (response.ok) {
        setHasVoted(true);
      }
    } catch (error) {
      console.error("Error sending vote:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 w-full">
      <div className="bg-gray-900 border border-gray-800 p-10 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col items-center text-center">

        <h1 className={`text-4xl font-extrabold mb-4 ${result.label === "FAKE" ? "text-red-500" : "text-green-500"}`}>
          {result.label === "FAKE" ? "LIKELY FAKE NEWS" : "LIKELY REAL NEWS"}
        </h1>

        <p className="text-gray-400 text-lg mb-1">AI Confidence Score</p>
        <p className="text-6xl font-black text-white mb-8">{percent}%</p>

        <div className="w-full bg-gray-800 rounded-full h-6 mb-8 overflow-hidden shadow-inner">
          <div
            className={`h-full transition-all duration-1000 ${result.label === "FAKE" ? "bg-red-600" : "bg-green-500"}`}
            style={{ width: `${percent}%` }}
          ></div>
        </div>

        <div className="w-full border-t border-gray-800 pt-8 mt-2">
          {!hasVoted ? (
            <div className="flex flex-col items-center w-full">
              <p className="mb-6 text-gray-300 text-lg">Do you agree with this AI analysis?</p>
              <div className="flex justify-center gap-4 w-full">
                <button
                  onClick={() => submitVote("AGREE")}
                  className="flex-1 py-4 bg-green-600 hover:bg-green-500 text-white rounded-xl font-bold transition duration-200 text-lg shadow-lg"
                >
                  👍 I Agree
                </button>
                <button
                  onClick={() => submitVote("DISAGREE")}
                  className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold transition duration-200 text-lg shadow-lg"
                >
                  👎 I Disagree
                </button>
              </div>
            </div>
          ) : (
            <div className="w-full py-5 bg-green-900/30 rounded-xl border border-green-800/50">
              <p className="text-green-400 font-bold text-lg text-center">
                ✅ Your vote has been recorded on the database!
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => router.push("/verify")}
          className="mt-10 px-8 py-4 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl transition font-medium w-full border border-gray-700"
        >
          Analyze Another Article
        </button>

      </div>
    </div>
  );
}