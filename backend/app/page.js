export default function Home() {
  return (
    <main className="container main-content">
      <h1 style={{ fontSize: '3.5rem', fontWeight: '800', textAlign: 'center', lineHeight: '1.2' }}>
        Decentralized AI<br />
        <span style={{ background: 'linear-gradient(to right, #3b82f6, #8b5cf6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Truth Detector
        </span>
      </h1>
      <p style={{ fontSize: '1.25rem', color: '#a1a1aa', maxWidth: '600px', textAlign: 'center' }}>
        Verify news articles instantly using our decentralized AI consensus mechanism.
        Detect fake news with transparency and community voting.
      </p>

      <div style={{ marginTop: '2rem' }}>
        <a href="/verify" className="btn btn-primary">
          Start Verifying &rarr;
        </a>
      </div>
    </main>
  );
}
