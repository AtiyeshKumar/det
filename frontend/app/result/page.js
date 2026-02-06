import ResultCard from '../../components/ResultCard';
import VoteButtons from '../../components/VoteButtons';
import Link from 'next/link';

export default function ResultPage() {
    return (
        <main className="container main-content">
            <ResultCard />
            <VoteButtons />

            <div style={{ marginTop: '3rem' }}>
                <Link href="/verify" className="btn" style={{
                    border: '1px solid var(--card-border)',
                    color: 'var(--foreground)'
                }}>
                    Check Another Article
                </Link>
            </div>
        </main>
    );
}
