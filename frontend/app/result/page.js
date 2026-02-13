'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VoteButtons from '../../components/VoteButtons';

export default function ResultPage() {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // 1. Read from localStorage
        const data = localStorage.getItem('prediction');

        if (!data) {
            // 2. Redirect if no data
            router.push('/verify');
            return;
        }

        try {
            setPrediction(JSON.parse(data));
        } catch (error) {
            console.error('Error parsing prediction data:', error);
            router.push('/verify');
        } finally {
            setLoading(false);
        }
    }, [router]);

    if (loading || !prediction) {
        return (
            <main className="container main-content">
                <div style={{ color: 'var(--foreground)' }}>Loading result...</div>
            </main>
        );
    }

    const { label, fake_probability } = prediction;
    const isFake = label === 'FAKE';
    const confidence = Math.round(fake_probability * 100);

    // Design constants based on globals.css
    const badgeColor = isFake ? 'var(--danger)' : 'var(--success)';
    const badgeText = isFake ? 'FAKE NEWS DETECTED' : 'LIKELY REAL NEWS';

    return (
        <main className="container main-content">

            <div className="card" style={{
                maxWidth: '800px',
                width: '100%',
                textAlign: 'center',
                padding: '3rem 2rem'
            }}>

                {/* 3. Big Badge */}
                <div style={{
                    display: 'inline-block',
                    backgroundColor: badgeColor,
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '0.5rem',
                    fontSize: '2rem',
                    fontWeight: '800',
                    marginBottom: '2rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    letterSpacing: '0.05em'
                }}>
                    {badgeText}
                </div>

                {/* 4. Confidence Bar */}
                <div style={{ marginBottom: '2rem' }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.5rem',
                        fontWeight: '600',
                        color: 'var(--foreground)'
                    }}>
                        <span>AI Confidence Score</span>
                        <span>{confidence}%</span>
                    </div>

                    <div style={{
                        width: '100%',
                        height: '1.5rem',
                        backgroundColor: 'var(--card-border)',
                        borderRadius: '999px',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${confidence}%`,
                            height: '100%',
                            backgroundColor: badgeColor,
                            transition: 'width 1s ease-out'
                        }} />
                    </div>
                </div>

                {/* 5. Explanation */}
                <p style={{
                    fontSize: '1.1rem',
                    lineHeight: '1.6',
                    color: '#a1a1aa',
                    marginBottom: '3rem',
                    maxWidth: '600px',
                    marginLeft: 'auto',
                    marginRight: 'auto'
                }}>
                    Our AI has analyzed the linguistic patterns and source credibility of this article.
                    A score of <strong>{confidence}%</strong> indicates a high probability that this content is
                    <strong> {label.toLowerCase()}</strong>. Always verify with multiple sources.
                </p>

                {/* 6. Action Button */}
                <Link href="/verify" className="btn btn-primary" style={{ fontSize: '1.1rem', padding: '1rem 2rem' }}>
                    Analyze Another Article
                </Link>

            </div>

            <VoteButtons />

        </main>
    );
}
