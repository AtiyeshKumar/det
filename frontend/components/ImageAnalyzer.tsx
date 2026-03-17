'use client';

import { useState, useRef, useCallback, ChangeEvent, DragEvent } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
interface AnalysisResult {
    verdict: 'DEEPFAKE' | 'REAL';
    scores: {
        Deepfake: number;
        Realism: number;
    };
    filename: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function ScoreBar({
    label,
    value,
    color,
}: {
    label: string;
    value: number;
    color: string;
}) {
    return (
        <div style={{ marginBottom: '1.25rem' }}>
            {/* Label row */}
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '0.4rem',
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    color: 'var(--foreground)',
                }}
            >
                <span>{label}</span>
                <span style={{ color }}>{value.toFixed(2)}%</span>
            </div>

            {/* Track */}
            <div
                style={{
                    height: '10px',
                    background: 'rgba(255,255,255,0.07)',
                    borderRadius: '99px',
                    overflow: 'hidden',
                }}
            >
                {/* Fill */}
                <div
                    style={{
                        height: '100%',
                        width: `${value}%`,
                        background: `linear-gradient(90deg, ${color}99, ${color})`,
                        borderRadius: '99px',
                        boxShadow: `0 0 10px ${color}88`,
                        transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)',
                    }}
                />
            </div>
        </div>
    );
}

// ── Main Component ───────────────────────────────────────────────────────────
export default function ImageAnalyzer() {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<AnalysisResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [dragging, setDragging] = useState(false);

    const inputRef = useRef<HTMLInputElement>(null);

    // ── File selection ────────────────────────────────────────────────────────
    const handleFile = useCallback((selected: File | null) => {
        if (!selected) return;
        setFile(selected);
        setResult(null);
        setError(null);
        const url = URL.createObjectURL(selected);
        setPreview(url);
    }, []);

    const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files?.[0] ?? null);
    };

    // ── Drag-and-drop ─────────────────────────────────────────────────────────
    const onDragOver = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(true);
    };
    const onDragLeave = () => setDragging(false);
    const onDrop = (e: DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files?.[0] ?? null);
    };

    // ── Analyze ───────────────────────────────────────────────────────────────
    const analyze = async () => {
        if (!file) return;

        setLoading(true);
        setError(null);
        setResult(null);

        try {
            const formData = new FormData();
            formData.append('file', file);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/analyze-image`, {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) {
                const detail = await res.json().catch(() => ({}));
                throw new Error(detail?.detail ?? `Server error ${res.status}`);
            }

            const data: AnalysisResult = await res.json();
            setResult(data);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
        } finally {
            setLoading(false);
        }
    };

    // ── Derived ───────────────────────────────────────────────────────────────
    const isDeepfake = result?.verdict === 'DEEPFAKE';
    const verdictColor = isDeepfake ? 'var(--danger)' : 'var(--success)';
    const verdictGlow = isDeepfake ? '#ef444488' : '#10b98188';

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div
            style={{
                maxWidth: '580px',
                width: '100%',
                margin: '0 auto',
                fontFamily: 'var(--font-sans)',
            }}
        >
            {/* ── Card ── */}
            <div className="card" style={{ padding: '2rem', borderRadius: '1.25rem' }}>

                {/* Header */}
                <div style={{ marginBottom: '1.75rem', textAlign: 'center' }}>
                    <h2
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: 700,
                            background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            marginBottom: '0.35rem',
                        }}
                    >
                        🔬 Image Forensics
                    </h2>
                    <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.45)' }}>
                        Powered by ViT · RTX 3050 GPU
                    </p>
                </div>

                {/* ── Drop Zone ── */}
                <div
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => inputRef.current?.click()}
                    style={{
                        border: `2px dashed ${dragging ? 'var(--primary)' : 'rgba(255,255,255,0.15)'}`,
                        borderRadius: '1rem',
                        padding: '2rem 1rem',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: dragging
                            ? 'rgba(59,130,246,0.06)'
                            : preview
                                ? 'transparent'
                                : 'rgba(255,255,255,0.02)',
                        marginBottom: '1.25rem',
                        position: 'relative',
                        overflow: 'hidden',
                    }}
                >
                    {preview ? (
                        /* Image preview */
                        <div style={{ position: 'relative' }}>
                            <img
                                src={preview}
                                alt="Selected"
                                style={{
                                    maxHeight: '220px',
                                    maxWidth: '100%',
                                    borderRadius: '0.75rem',
                                    objectFit: 'contain',
                                    display: 'block',
                                    margin: '0 auto',
                                }}
                            />
                            <p
                                style={{
                                    marginTop: '0.75rem',
                                    fontSize: '0.78rem',
                                    color: 'rgba(255,255,255,0.4)',
                                }}
                            >
                                {file?.name} · Click to change
                            </p>
                        </div>
                    ) : (
                        /* Placeholder */
                        <div>
                            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🖼️</div>
                            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>
                                Drag &amp; drop an image here, or{' '}
                                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>
                                    browse
                                </span>
                            </p>
                            <p
                                style={{
                                    marginTop: '0.5rem',
                                    fontSize: '0.75rem',
                                    color: 'rgba(255,255,255,0.25)',
                                }}
                            >
                                JPEG · PNG · WEBP supported
                            </p>
                        </div>
                    )}
                </div>

                {/* Hidden file input */}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={onInputChange}
                    id="image-upload-input"
                />

                {/* ── Analyze Button ── */}
                <button
                    onClick={analyze}
                    disabled={!file || loading}
                    className="btn btn-primary"
                    id="analyze-button"
                    style={{
                        width: '100%',
                        padding: '0.85rem',
                        fontSize: '1rem',
                        borderRadius: '0.75rem',
                        opacity: !file || loading ? 0.5 : 1,
                        cursor: !file || loading ? 'not-allowed' : 'pointer',
                    }}
                >
                    {loading ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span
                                style={{
                                    width: '16px',
                                    height: '16px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderTop: '2px solid #fff',
                                    borderRadius: '50%',
                                    display: 'inline-block',
                                    animation: 'spin 0.8s linear infinite',
                                }}
                            />
                            Analysing on GPU…
                        </span>
                    ) : (
                        '🔍 Analyze Image'
                    )}
                </button>

                {/* ── Error ── */}
                {error && (
                    <div
                        style={{
                            marginTop: '1.25rem',
                            padding: '0.85rem 1rem',
                            borderRadius: '0.75rem',
                            background: 'rgba(239,68,68,0.1)',
                            border: '1px solid rgba(239,68,68,0.3)',
                            color: '#fca5a5',
                            fontSize: '0.875rem',
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}

                {/* ── Results ── */}
                {result && (
                    <div
                        style={{
                            marginTop: '1.75rem',
                            borderTop: '1px solid rgba(255,255,255,0.08)',
                            paddingTop: '1.75rem',
                        }}
                    >
                        {/* Verdict badge */}
                        <div
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.6rem',
                                marginBottom: '1.75rem',
                            }}
                        >
                            <div
                                id="verdict-badge"
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    padding: '0.5rem 1.25rem',
                                    borderRadius: '99px',
                                    border: `1px solid ${verdictColor}`,
                                    background: `${verdictColor}18`,
                                    boxShadow: `0 0 18px ${verdictGlow}`,
                                    color: verdictColor,
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    letterSpacing: '0.08em',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {isDeepfake ? '⚠️ Deepfake Detected' : '✅ Likely Real'}
                            </div>
                        </div>

                        {/* Score bars */}
                        <ScoreBar
                            label="Deepfake"
                            value={result.scores.Deepfake}
                            color="#ef4444"
                        />
                        <ScoreBar
                            label="Realism"
                            value={result.scores.Realism}
                            color="#10b981"
                        />

                        {/* Filename */}
                        <p
                            style={{
                                marginTop: '1rem',
                                fontSize: '0.75rem',
                                color: 'rgba(255,255,255,0.25)',
                                textAlign: 'center',
                            }}
                        >
                            Analysed: {result.filename}
                        </p>
                    </div>
                )}
            </div>

            {/* Spinner keyframe */}
            <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
        </div>
    );
}
