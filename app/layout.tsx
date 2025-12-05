import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { WalletProvider } from '@/contexts/WalletContext';
import { AdminProvider } from '@/contexts/AdminContext';

export const metadata: Metadata = {
    title: 'Node Speak',
    description: 'A calm social space for decentralized communities',
    icons: {
        icon: [
            { url: '/favicon.ico' },
            { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
            { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        ],
        apple: { url: '/apple-touch-icon.png' },
    },
    manifest: '/site.webmanifest',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
                <link rel="icon" href="/favicon.ico" sizes="any" />
                <link rel="icon" href="/favicon-16x16.png" type="image/png" sizes="16x16" />
                <link rel="icon" href="/favicon-32x32.png" type="image/png" sizes="32x32" />
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
                <link rel="manifest" href="/site.webmanifest" />
            </head>
            <body>
                <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
                    <WalletProvider>
                        <AdminProvider>
                            {children}
                            <Toaster />
                        </AdminProvider>
                    </WalletProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}