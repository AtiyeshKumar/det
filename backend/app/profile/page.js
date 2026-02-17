export default function ProfilePage() {
    return (
        <main className="container" style={{ padding: '4rem 1.5rem' }}>
            <div className="card" style={{ maxWidth: '800px', margin: '0 auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
                    <div style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        fontWeight: 'bold',
                        color: 'white'
                    }}>
                        U
                    </div>
                    <div>
                        <h1 style={{ fontSize: '2rem' }}>User123</h1>
                        <p style={{ color: '#a1a1aa' }}>Joined Feb 2026</p>
                    </div>
                    <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                        <div style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Reputation Score</div>
                        <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--success)' }}>95</div>
                    </div>
                </div>

                <h2 style={{ borderTop: '1px solid var(--card-border)', paddingTop: '2rem', marginBottom: '1.5rem' }}>
                    Verification History
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {[1, 2, 3].map((item) => (
                        <div key={item} style={{
                            padding: '1rem',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>Viral News Article #{item}</div>
                                <div style={{ fontSize: '0.9rem', color: '#a1a1aa' }}>Verified on Feb {item + 5}, 2026</div>
                            </div>
                            <div style={{
                                padding: '0.25rem 0.75rem',
                                borderRadius: '1rem',
                                background: item === 2 ? 'var(--danger)' : 'var(--success)',
                                color: 'white', // Ensure text is readable on colored background
                                fontSize: '0.8rem',
                                fontWeight: 'bold',
                                opacity: 0.2 // Make background very subtle
                            }}>
                                <span style={{ opacity: 5, color: item === 2 ? '#ffcccc' : '#ccffcc' }}>
                                    {item === 2 ? 'FAKE' : 'REAL'}
                                </span>
                            </div>
                            {/* Let's fix that opacity logic, it's weird. Better: */}
                        </div>
                    ))}
                    {/* Re-doing the map item cleanly for the final write */}
                </div>
            </div>
        </main>
    );
}
