"use client";

import { Mail, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

export function Sidebar({ onRefresh }: { onRefresh?: () => void }) {
  const [currentEmail, setCurrentEmail] = useState<string>("Loading...");

  useEffect(() => {
    const accountCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mail_tm_account="));
    if (accountCookie) {
      try {
        const accountData = JSON.parse(
          decodeURIComponent(accountCookie.split("=")[1])
        );
        setCurrentEmail(accountData.email || "No email found");
      } catch (e) {
        setCurrentEmail("Error loading email");
      }
    }
  }, []);

  return (
    <div className="flex flex-col h-full w-[240px] border-r bg-muted/10">
      <div className="p-4">
        <Logo />
      </div>
      <Separator />
      <div className="flex-1 overflow-auto p-4">
        <nav className="space-y-2">
          <div className="flex items-center gap-2 rounded-lg px-3 py-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm truncate" title={currentEmail}>
              {currentEmail}
            </span>
          </div>
        </nav>
      </div>
      <Separator />
      <div className="p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => {
            onRefresh?.();
            toast.success("Refreshing emails");
          }}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>
    </div>
  );
}
