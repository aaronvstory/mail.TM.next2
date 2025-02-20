import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Temporary Email",
  description: "View your temporary email inbox",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
