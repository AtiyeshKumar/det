import './globals.css';
import AuthProvider from "@/components/SessionProvider";
import Navbar from "@/components/Navbar";

export const metadata = {
  title: "Truth Detector AI",
  description: "Verify rumors with AI",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-200 bg-slate-900">
        <AuthProvider>
          <Navbar />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
