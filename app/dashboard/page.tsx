"use client";

import { useEffect, useState } from "react";
import { getMessages, getMessage, type Message } from "@/lib/mail-tm/client";
import { Sidebar } from "@/components/sidebar";
import { EmailLayout } from "@/components/email-layout";

export default function DashboardPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [selectedEmail, setSelectedEmail] = useState<Message | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const fetchEmails = async () => {
    try {
      setIsLoading(true);
      const { messages: fetchedMessages, total } = await getMessages(
        currentPage
      );
      setMessages(fetchedMessages);
      setTotalMessages(total);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [currentPage]);

  const handleEmailClick = async (email: Message) => {
    try {
      const fullEmail = await getMessage(email.id);
      setSelectedEmail(fullEmail);
    } catch (error) {
      console.error("Failed to fetch email details:", error);
    }
  };

  return (
    <div className="flex h-screen">
      <Sidebar onRefresh={fetchEmails} />
      <EmailLayout
        emails={messages}
        selectedEmail={selectedEmail}
        onEmailClick={handleEmailClick}
        isLoading={isLoading}
        totalEmails={totalMessages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}
