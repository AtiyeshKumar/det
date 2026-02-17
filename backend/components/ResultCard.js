export default function ResultCard({
    score = 85,
    verdict = "Likely True",
    explanation = "The article cites verifiable sources and cross-references with known reliable databases. No manipulation patterns detected."
}) {
    const getColor = (s) => {
        if (s >= 70) return 'var(--success)';
        if (s >= 40) return 'var(--warning)';
        return 'var(--danger)';
    };

    const color = getColor(score);

    return (
        <div className="card" style={{ width: '100%', maxWidth: '800px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '2rem' }}>Analysis Result</h2>

            <div style={{
                width: '150px',
                height: '150px',
                borderRadius: '50%',
                border: `8px solid ${color}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 2rem auto',
                fontSize: '3rem',
                fontWeight: 'bold',
                color: color,
                boxShadow: `0 0 20px ${color}40`
            }}>
                {score}%
            </div>

            <h3 style={{ fontSize: '2rem', marginBottom: '1rem', color: color }}>
                {verdict}
            </h3>

            <p style={{ fontSize: '1.1rem', lineHeight: '1.6', color: '#d4d4d8' }}>
                {explanation}
            </p>
        </div>
    );
}
