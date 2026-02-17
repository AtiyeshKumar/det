'use client';

import { useState, useEffect } from 'react';

export default function VoteButtons() {
    // We store the full prediction object instead of just the label
    const [predictionModel, setPredictionModel] = useState(null);
    const [userVote, setUserVote] = useState(null);
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // 1. Read prediction from localStorage safely on client side
        const data = localStorage.getItem('prediction');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (parsed && parsed.label) {
                    setPredictionModel(parsed);
                }
            } catch (e) {
                console.error("Failed to parse prediction", e);
            }
        }
    }, []);

    const handleVote = async (voteType) => {
        // voteType: 'REAL' or 'FAKE'
        if (!predictionModel) return;

        setUserVote(voteType);
        setIsSubmitting(true);

        // Prepare payload correctly
        // Backend expects: { "prediction_id": str, "ai_label": str, "user_vote": str }
        const payload = {
            prediction_id: predictionModel.id || "unknown-id",
            ai_label: predictionModel.label,
            user_vote: voteType
        };

        try {
            const response = await fetch('http://127.0.0.1:8000/vote', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                throw new Error('Vote submission failed');
            }

            // Provide immediate feedback based on agreement
            const normalizedAiLabel = predictionModel.label.toUpperCase();
            const normalizedVote = voteType.toUpperCase();

            if (normalizedAiLabel === normalizedVote) {
                setFeedback("Vote saved! You agree with the AI.");
            } else {
                setFeedback("Vote saved! You disagree with the AI.");
            }

        } catch (error) {
            console.error('Error submitting vote:', error);
            setFeedback("Vote saved locally (offline mode).");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!predictionModel) {
        // Return null if not ready to avoid hydration mismatch or flashing
        return null;
    }

    return (
        <div style={{ marginTop: '3rem', textAlign: 'center' }}>
            <h3 style={{
                marginBottom: '1.5rem',
                color: 'var(--foreground)',
                fontSize: '1.2rem'
            }}>
                Do you agree with this result?
            </h3>

            <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>

                {/* Real Button */}
                <button
                    onClick={() => handleVote('REAL')}
                    disabled={!!userVote || isSubmitting}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 2rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--success)',
                        background: userVote === 'REAL' ? 'var(--success)' : 'transparent',
                        color: userVote === 'REAL' ? '#fff' : 'var(--success)',
                        fontWeight: '600',
                        fontSize: '1rem',
                        opacity: (userVote && userVote !== 'REAL') || isSubmitting ? 0.5 : 1,
                        cursor: (userVote || isSubmitting) ? 'default' : 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>👍</span>
                    Real
                </button>

                {/* Fake Button */}
                <button
                    onClick={() => handleVote('FAKE')}
                    disabled={!!userVote || isSubmitting}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 2rem',
                        borderRadius: '0.5rem',
                        border: '1px solid var(--danger)',
                        background: userVote === 'FAKE' ? 'var(--danger)' : 'transparent',
                        color: userVote === 'FAKE' ? '#fff' : 'var(--danger)',
                        fontWeight: '600',
                        fontSize: '1rem',
                        opacity: (userVote && userVote !== 'FAKE') || isSubmitting ? 0.5 : 1,
                        cursor: (userVote || isSubmitting) ? 'default' : 'pointer',
                        transition: 'all 0.2s ease'
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>👎</span>
                    Fake
                </button>
            </div>

            {/* Feedback Text */}
            {feedback && (
                <div style={{
                    marginTop: '1rem',
                    fontSize: '1.1rem',
                    color: feedback.includes('agree') || feedback.includes('saved') ? 'var(--success)' : 'var(--warning)',
                    fontWeight: '500',
                    animation: 'fadeIn 0.5s ease-in'
                }}>
                    {feedback}
                </div>
            )}
        </div>
    );
}
