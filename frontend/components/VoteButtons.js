'use client';

import { useState } from 'react';

export default function VoteButtons() {
    const [voted, setVoted] = useState(null);

    const options = [
        { label: 'Real', value: 'real', color: 'var(--success)' },
        { label: 'Fake', value: 'fake', color: 'var(--danger)' },
        { label: 'Unsure', value: 'unsure', color: 'var(--warning)' }
    ];

    return (
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <p style={{ marginBottom: '1rem', color: '#a1a1aa' }}>Do you agree? Cast your community vote:</p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                {options.map((opt) => (
                    <button
                        key={opt.value}
                        onClick={() => setVoted(opt.value)}
                        style={{
                            padding: '0.75rem 2rem',
                            borderRadius: '2rem',
                            border: `1px solid ${opt.color}`,
                            background: voted === opt.value ? opt.color : 'transparent',
                            color: voted === opt.value ? '#000' : opt.color,
                            fontWeight: 'bold',
                            transition: 'all 0.2s',
                            opacity: voted && voted !== opt.value ? 0.5 : 1
                        }}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
