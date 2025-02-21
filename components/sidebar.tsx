"use client";

import { Mail, RefreshCcw, LogOut, Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/logo";
import { logout } from "@/lib/mail-tm/client";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export function Sidebar({ onRefresh }: { onRefresh?: () => void }) {
  const router = useRouter();
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

  const handleLogout = () => {
    logout();
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  const handleExportAccounts = () => {
    const accounts = document.cookie
      .split("; ")
      .find((row) => row.startsWith("mail_tm_accounts="));

    if (accounts) {
      const accountsCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mail_tm_account="));
      let primaryEmail = "unknown";
      if (accountsCookie) {
        try {
          const accountData = JSON.parse(decodeURIComponent(accountsCookie.split("=")[1]));
          primaryEmail = accountData.email.split("@")[0];
        } catch (e) {
          console.error("Error parsing account data:", e);
        }
      }

      const now = new Date();
      const dateStr = now.toISOString().replace(/[:.]/g, "-").slice(0, 19);
      const fileName = `mail-tm-accounts_${primaryEmail}_${dateStr}.json`;

      const accountsData = decodeURIComponent(accounts.split("=")[1]);
      const blob = new Blob([accountsData], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Accounts exported successfully");
    } else {
      toast.error("No accounts to export");
    }
  };

  const handleImportAccounts = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          const accounts = JSON.parse(text);
          const expires = new Date(
            Date.now() + 24 * 60 * 60 * 1000
          ).toUTCString();
          document.cookie = `mail_tm_accounts=${JSON.stringify(
            accounts
          )}; path=/; expires=${expires}; SameSite=Strict; Secure`;
          toast.success("Accounts imported successfully");
          window.location.reload();
        } catch (e) {
          toast.error("Failed to import accounts");
          console.error("Import error:", e);
        }
      }
    };
    input.click();
  };

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
      <div className="p-4 space-y-2">
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
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleExportAccounts}
        >
          <Download className="mr-2 h-4 w-4" />
          Export Accounts
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleImportAccounts}
        >
          <Upload className="mr-2 h-4 w-4" />
          Import Accounts
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start text-destructive hover:text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
}
