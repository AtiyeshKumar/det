'use client'; // Client component for interactivity

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewsInput() {
    const [text, setText] = useState('');
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        // In a real app, we'd pass data. here we just navigate for demo.
        router.push('/result');
    };

    return (
        <form onSubmit={handleSubmit} className="card" style={{ width: '100%', maxWidth: '800px' }}>
            <h2 style={{ marginBottom: '1rem', fontSize: '1.5rem' }}>Verify Article</h2>
            <p style={{ marginBottom: '1.5rem', color: '#a1a1aa' }}>
                Paste the text of the news article or social media post you want to verify.
            </p>

            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste text here..."
                style={{
                    width: '100%',
                    height: '200px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid var(--card-border)',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    color: 'inherit',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    marginBottom: '1.5rem',
                    fontSize: '1rem'
                }}
            />

            <div style={{ textAlign: 'right' }}>
                <button type="submit" className="btn btn-primary">
                    Analyze Content
                </button>
            </div>
        </form>
    );
}
