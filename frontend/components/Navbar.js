import Link from 'next/link';

export default function Navbar() {
    return (
        <nav style={{
            borderBottom: '1px solid var(--card-border)',
            background: 'rgba(23, 23, 23, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '4rem'
            }}>
                <Link href="/" style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    <span style={{ color: 'var(--primary)' }}>AI</span> Truth Detector
                </Link>

                <div style={{ display: 'flex', gap: '2rem' }}>
                    <Link href="/" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Home</Link>
                    <Link href="/verify" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Verify</Link>
                    <Link href="/profile" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Profile</Link>
                </div>
            </div>
        </nav>
    );
}
