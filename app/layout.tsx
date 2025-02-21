import type React from "react";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Temporary Email",
  description: "Create and manage temporary email addresses",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TempMail",
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TempMail" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body className={`${inter.className} dark`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          storageKey="tempmail-theme"
        >
          {children}
          <Toaster />
        </ThemeProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  navigator.serviceWorker.register('/sw.js').then(registration => {
                    console.log('ServiceWorker registration successful');

                    // Request notification permission
                    if ('Notification' in window) {
                      Notification.requestPermission().then(permission => {
                        if (permission === 'granted') {
                          console.log('Notification permission granted');
                        }
                      });
                    }

                    // Subscribe to push notifications
                    registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY' // You'll need to replace this with your actual VAPID key
                    }).then(subscription => {
                      console.log('Push notification subscription successful');
                    }).catch(err => {
                      console.log('Push notification subscription failed:', err);
                    });
                  }).catch(err => {
                    console.log('ServiceWorker registration failed:', err);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
