import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";
import { ReactQueryProvider } from "@/components/providers/react-query-provider";
import { AuthProvider } from "@/hooks/use-auth";

export const metadata: Metadata = {
  title: "TCC Global | Revealing the Kingdom",
  description:
    "TCC Global is a Spirit-filled church family helping people discover, develop, and deploy their God-given abilities for kingdom advancement and social transformation.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryProvider>
          <AuthProvider>
            {children}
            <Toaster position="top-right" richColors />
          </AuthProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
