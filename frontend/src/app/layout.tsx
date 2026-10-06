import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { AuthProvider } from "@/lib/auth-context";
import { AppShell } from "@/components/shell/AppShell";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "VOUCH — Work you can prove",
  description:
    "A trust-first collaboration platform where every contribution, escrow lock, and rating is provable on an immutable ledger.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <QueryProvider>
          <ThemeProvider>
            <AuthProvider>
              <AppShell>{children}</AppShell>
              <Toaster position="bottom-right" richColors />
            </AuthProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
