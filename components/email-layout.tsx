"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Inbox, Send, Trash2, RefreshCcw, ArrowLeft, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { AccountSwitcher } from "./account-switcher";

interface Email {
  id: string;
  from: {
    address: string;
    name?: string;
  };
  to: Array<{ address: string; name?: string }>;
  subject: string;
  intro: string;
  text: string;
  html: string;
  createdAt: string;
  seen: boolean;
}

export interface EmailLayoutHandle {
  fetchEmails: () => Promise<void>;
}

export const EmailLayout = forwardRef<EmailLayoutHandle>((props, ref) => {
  const [currentEmail, setCurrentEmail] = useState<Email | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const formatSender = (from: { address: string; name?: string }) => {
    if (from.name && from.name !== from.address) {
      return `${from.name} <${from.address}>`;
    }
    return from.address;
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mail_tm_token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("https://api.mail.tm/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch emails");
      }

      const data = await response.json();
      const fetchedEmails = data["hydra:member"];
      setEmails(fetchedEmails);
      filterEmails(fetchedEmails, searchQuery);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmails = (emailsToFilter: Email[], query: string) => {
    if (!query.trim()) {
      setFilteredEmails(emailsToFilter);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = emailsToFilter.filter(email =>
      email.subject.toLowerCase().includes(lowercaseQuery) ||
      email.intro.toLowerCase().includes(lowercaseQuery) ||
      email.from.address.toLowerCase().includes(lowercaseQuery) ||
      (email.from.name && email.from.name.toLowerCase().includes(lowercaseQuery))
    );
    setFilteredEmails(filtered);
  };

  useEffect(() => {
    filterEmails(emails, searchQuery);
  }, [searchQuery, emails]);

  const markAsRead = async (id: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mail_tm_token="))
        ?.split("=")[1];
      if (!token) return;

      await fetch(`https://api.mail.tm/messages/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/merge-patch+json",
        },
        body: JSON.stringify({ seen: true }),
      });
    } catch (error) {
      console.error("Failed to mark email as read:", error);
    }
  };

  const fetchEmailContent = async (id: string) => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mail_tm_token="))
        ?.split("=")[1];

      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`https://api.mail.tm/messages/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch email content");
      }

      const data = await response.json();
      setCurrentEmail(data);
      markAsRead(id);
    } catch (error) {
      console.error("Failed to fetch email content:", error);
    }
  };

  useImperativeHandle(ref, () => ({
    fetchEmails,
  }));

  useEffect(() => {
    fetchEmails();
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleEmailClick = (email: Email) => {
    fetchEmailContent(email.id);
  };

  if (currentEmail) {
    return (
      <div className="flex-1 p-6">
        <Button
          variant="ghost"
          className="mb-4"
          onClick={() => setCurrentEmail(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold">{currentEmail.subject}</h1>
            <div className="mt-2 space-y-1 text-sm text-muted-foreground">
              <p>From: {formatSender(currentEmail.from)}</p>
              <p>To: {currentEmail.to.map(to => formatSender(to)).join(", ")}</p>
              <p>
                {new Date(currentEmail.createdAt).toLocaleString(undefined, {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {currentEmail.html ? (
              <div
                dangerouslySetInnerHTML={{ __html: currentEmail.html }}
                className="email-content"
              />
            ) : (
              <pre className="whitespace-pre-wrap font-sans">
                {currentEmail.text}
              </pre>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b">
        <AccountSwitcher />
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline" onClick={fetchEmails} disabled={loading}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="flex-1 p-4">
        <Tabs defaultValue="inbox" className="h-full">
          <TabsList className="grid w-[400px] grid-cols-3">
            <TabsTrigger value="inbox">
              <Inbox className="h-4 w-4 mr-2" />
              Inbox
            </TabsTrigger>
            <TabsTrigger value="sent">
              <Send className="h-4 w-4 mr-2" />
              Sent
            </TabsTrigger>
            <TabsTrigger value="trash">
              <Trash2 className="h-4 w-4 mr-2" />
              Trash
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="h-full">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading emails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {searchQuery ? (
                  <>
                    <h3 className="text-xl font-semibold mb-2">No matching emails</h3>
                    <p className="text-muted-foreground">
                      Try different search terms
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold mb-2">No emails yet</h3>
                    <p className="text-muted-foreground">
                      Your temporary email is ready to receive messages
                    </p>
                  </>
                )}
                <Button variant="outline" className="mt-4" onClick={fetchEmails}>
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Check for new emails
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-[calc(100vh-12rem)]">
                <div className="space-y-4">
                  {filteredEmails.map((email) => (
                    <Card
                      key={email.id}
                      className={`cursor-pointer hover:bg-muted/50 ${
                        !email.seen ? "border-l-4 border-l-primary" : ""
                      }`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <CardHeader>
                        <CardTitle className={`text-base ${!email.seen ? "font-bold" : ""}`}>
                          {email.subject}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          From: {formatSender(email.from)}
                        </p>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{email.intro}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(email.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
          <TabsContent value="sent">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Sent emails will appear here</p>
            </div>
          </TabsContent>
          <TabsContent value="trash">
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">
                Deleted emails will appear here
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});
