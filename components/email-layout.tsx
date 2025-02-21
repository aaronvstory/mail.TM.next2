"use client";

import { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import {
  Inbox,
  Search,
  RefreshCcw,
  ArrowLeft,
  DownloadCloud,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AccountSwitcher } from "./account-switcher";
import { getMessage } from "@/lib/mail-tm/client";
import { toast } from "sonner";

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
  const [fullEmailContents, setFullEmailContents] = useState<
    Record<string, { text: string; html: string }>
  >({});

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

      // Pre-fetch full content for search
      const contents: Record<string, { text: string; html: string }> = {};
      for (const email of fetchedEmails) {
        try {
          const fullEmail = await getMessage(email.id);
          contents[email.id] = {
            text: fullEmail.text || "",
            html: fullEmail.html || "",
          };
        } catch (error) {
          console.error(
            `Failed to fetch content for email ${email.id}:`,
            error
          );
        }
      }
      setFullEmailContents(contents);

      filterEmails(fetchedEmails, searchQuery, contents);
    } catch (error) {
      console.error("Failed to fetch emails:", error);
    } finally {
      setLoading(false);
    }
  };

  const stripHtml = (html: string) => {
    const doc = new DOMParser().parseFromString(html, "text/html");
    return doc.body.textContent || "";
  };

  const filterEmails = (
    emailsToFilter: Email[],
    query: string,
    contents: Record<string, { text: string; html: string }> = fullEmailContents
  ) => {
    if (!query.trim()) {
      setFilteredEmails(emailsToFilter);
      return;
    }

    const lowercaseQuery = query.toLowerCase();
    const filtered = emailsToFilter.filter((email) => {
      const emailContent = contents[email.id];
      const fullText = [
        email.subject,
        email.intro,
        emailContent?.text || "",
        stripHtml(emailContent?.html || ""),
        email.from.address,
        email.from.name || "",
        ...email.to.map((to) => `${to.name || ""} ${to.address}`),
      ]
        .join(" ")
        .toLowerCase();

      return fullText.includes(lowercaseQuery);
    });

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
      const fullEmail = await getMessage(id);
      setCurrentEmail(fullEmail);
      markAsRead(id);

      // Update full content cache
      setFullEmailContents((prev) => ({
        ...prev,
        [id]: {
          text: fullEmail.text || "",
          html: fullEmail.html || "",
        },
      }));
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

  const exportEmails = async (format: "html" | "json" | "pdf" | "markdown") => {
    try {
      const emailsToExport =
        filteredEmails.length > 0 ? filteredEmails : emails;
      let content = "";
      let mimeType = "";
      let fileExtension = "";

      switch (format) {
        case "html":
          content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Exported Emails</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .email { border: 1px solid #ddd; margin: 20px 0; padding: 20px; border-radius: 8px; }
    .subject { font-size: 1.2em; font-weight: bold; }
    .meta { color: #666; margin: 10px 0; }
    .content { margin-top: 20px; }
  </style>
</head>
<body>
  ${emailsToExport
    .map(
      (email) => `
    <div class="email">
      <div class="subject">${email.subject}</div>
      <div class="meta">
        <div>From: ${formatSender(email.from)}</div>
        <div>To: ${email.to.map((to) => formatSender(to)).join(", ")}</div>
        <div>Date: ${new Date(email.createdAt).toLocaleString()}</div>
      </div>
      <div class="content">
        ${email.html || email.text || email.intro}
      </div>
    </div>
  `
    )
    .join("\n")}
</body>
</html>`;
          mimeType = "text/html";
          fileExtension = "html";
          break;

        case "json":
          content = JSON.stringify(emailsToExport, null, 2);
          mimeType = "application/json";
          fileExtension = "json";
          break;

        case "markdown":
          content = emailsToExport
            .map(
              (email) => `
# ${email.subject}

**From:** ${formatSender(email.from)}
**To:** ${email.to.map((to) => formatSender(to)).join(", ")}
**Date:** ${new Date(email.createdAt).toLocaleString()}

---

${email.text || email.intro}

---
`
            )
            .join("\n\n");
          mimeType = "text/markdown";
          fileExtension = "md";
          break;

        case "pdf":
          // For PDF, we'll use the HTML version and convert it client-side
          const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Exported Emails</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; }
    .email { border: 1px solid #ddd; margin: 20px 0; padding: 20px; }
    .subject { font-size: 1.2em; font-weight: bold; }
    .meta { color: #666; margin: 10px 0; }
    .content { margin-top: 20px; }
  </style>
</head>
<body>
  ${emailsToExport
    .map(
      (email) => `
    <div class="email">
      <div class="subject">${email.subject}</div>
      <div class="meta">
        <div>From: ${formatSender(email.from)}</div>
        <div>To: ${email.to.map((to) => formatSender(to)).join(", ")}</div>
        <div>Date: ${new Date(email.createdAt).toLocaleString()}</div>
      </div>
      <div class="content">
        ${email.html || email.text || email.intro}
      </div>
    </div>
  `
    )
    .join("\n")}
</body>
</html>`;

          const { default: html2pdf } = await import("html2pdf.js");
          const element = document.createElement("div");
          element.innerHTML = htmlContent;
          document.body.appendChild(element);

          await html2pdf()
            .from(element)
            .save(`exported_emails_${new Date().toISOString()}.pdf`);
          document.body.removeChild(element);
          return;
      }

      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `emails_${timestamp}.${fileExtension}`;

      // Create and download the file
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Emails exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting emails:", error);
      toast.error("Failed to export emails");
    }
  };

  if (currentEmail) {
    return (
      <div className="flex-1 p-4">
        <Button
          variant="ghost"
          size="sm"
          className="mb-2"
          onClick={() => setCurrentEmail(null)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Inbox
        </Button>
        <div className="space-y-4">
          <div>
            <h1 className="text-xl font-bold">{currentEmail.subject}</h1>
            <div className="mt-1 space-y-0.5 text-sm text-muted-foreground">
              <p>From: {formatSender(currentEmail.from)}</p>
              <p>
                To: {currentEmail.to.map((to) => formatSender(to)).join(", ")}
              </p>
              <p>
                {new Date(currentEmail.createdAt).toLocaleString(undefined, {
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </p>
            </div>
          </div>
          <Separator />
          <div className="prose prose-sm dark:prose-invert max-w-none email-content">
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
      <div className="flex items-center justify-between p-2 border-b">
        <AccountSwitcher />
        <div className="flex items-center space-x-2">
          <div className="relative w-64">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8"
            />
            {searchQuery && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                {filteredEmails.length} results
              </span>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <DownloadCloud className="h-4 w-4 mr-2" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportEmails("html")}>
                Export as HTML
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportEmails("json")}>
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportEmails("pdf")}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportEmails("markdown")}>
                Export as Markdown
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmails}
            disabled={loading}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
      <div className="flex-1 p-2">
        <Tabs defaultValue="inbox" className="h-full">
          <TabsList className="w-[200px]">
            <TabsTrigger value="inbox" className="w-full">
              <Inbox className="h-3 w-3 mr-1" />
              Inbox
            </TabsTrigger>
          </TabsList>

          <TabsContent value="inbox" className="h-[calc(100%-40px)]">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-sm">Loading emails...</p>
              </div>
            ) : filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                {searchQuery ? (
                  <>
                    <h3 className="text-base font-semibold mb-1">
                      No matching emails
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Try different search terms
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="text-base font-semibold mb-1">
                      No emails yet
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Your temporary email is ready to receive messages
                    </p>
                  </>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={fetchEmails}
                >
                  <RefreshCcw className="h-3 w-3 mr-1" />
                  Check for new emails
                </Button>
              </div>
            ) : (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-2">
                  {filteredEmails.map((email) => (
                    <Card
                      key={email.id}
                      className={`email-list-card cursor-pointer hover:bg-muted/50 ${
                        !email.seen ? "border-l-4 border-l-primary" : ""
                      }`}
                      onClick={() => handleEmailClick(email)}
                    >
                      <CardHeader className="p-3">
                        <CardTitle
                          className={`email-subject ${
                            !email.seen ? "font-bold" : ""
                          }`}
                        >
                          {email.subject}
                        </CardTitle>
                        <p className="email-meta text-muted-foreground">
                          From: {formatSender(email.from)}
                        </p>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <p className="email-intro">{email.intro}</p>
                        <p className="email-meta text-muted-foreground mt-1">
                          {new Date(email.createdAt).toLocaleString()}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});
