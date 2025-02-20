"use client";

import { EmailLayout, type EmailLayoutHandle } from "@/components/email-layout";
import { Sidebar } from "@/components/sidebar";
import { useRef } from "react";

export default function DashboardPage() {
  const emailLayoutRef = useRef<EmailLayoutHandle>(null);

  const handleRefresh = () => {
    emailLayoutRef.current?.fetchEmails();
  };

  return (
    <div className="flex h-screen">
      <Sidebar onRefresh={handleRefresh} />
      <main className="flex-1">
        <EmailLayout ref={emailLayoutRef} />
      </main>
    </div>
  );
}
