"use client";
import Link from 'next/link';
import { useSession, signIn, signOut } from "next-auth/react";
import Logo from './Logo';

export default function Navbar() {
    const { data: session, status } = useSession();

    return (
        <nav style={{
            borderBottom: '1px solid var(--card-border)',
            background: 'rgba(23, 23, 23, 0.8)',
            backdropFilter: 'blur(10px)',
            position: 'sticky',
            top: 0,
            zIndex: 100
        }}>
            <div className="container mx-auto px-4" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: '4rem'
            }}>
                <Link href="/" className="flex items-center gap-2 group">
                    <Logo />
                    <span className="text-xl font-bold tracking-tight text-white group-hover:text-blue-400 transition-colors" style={{ fontFamily: 'Inter, sans-serif' }}>Truth Detector AI</span>
                </Link>

                <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                    <Link href="/" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Home</Link>
                    <Link href="/verify" style={{ color: 'var(--foreground)', opacity: 0.8 }}>Verify</Link>

                    {status === "authenticated" ? (
                        <div className="flex items-center gap-4">
                            {session.user.image && (
                                <img
                                    src={session.user.image}
                                    alt="Profile"
                                    className="w-8 h-8 rounded-full border border-gray-500"
                                />
                            )}
                            <button
                                onClick={() => signOut()}
                                className="text-sm bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md transition-colors"
                            >
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => signIn("google")}
                            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-medium"
                        >
                            Sign In
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
}
