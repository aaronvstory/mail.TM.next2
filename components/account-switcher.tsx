"use client";

import * as React from "react";
import {
  CaretSortIcon,
  CheckIcon,
  PlusCircledIcon,
} from "@radix-ui/react-icons";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { loginMailTm } from "@/lib/mail-tm/client";

interface Account {
  email: string;
  token: string;
  label: string;
}

export function AccountSwitcher() {
  const [accounts, setAccounts] = React.useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = React.useState<Account | null>(null);
  const [open, setOpen] = React.useState(false);
  const [showNewAccountDialog, setShowNewAccountDialog] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    // Load accounts from cookies on mount
    const loadAccounts = () => {
      const accountsCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("mail_tm_accounts="));
      if (accountsCookie) {
        try {
          const accounts = JSON.parse(decodeURIComponent(accountsCookie.split("=")[1]));
          setAccounts(accounts);
          // Set the current account as selected
          const currentToken = document.cookie
            .split("; ")
            .find((row) => row.startsWith("mail_tm_token="))
            ?.split("=")[1];
          if (currentToken) {
            const current = accounts.find(acc => acc.token === currentToken);
            if (current) setSelectedAccount(current);
          }
        } catch (e) {
          console.error("Error loading accounts:", e);
        }
      }
    };
    loadAccounts();
  }, []);

  const saveAccounts = (newAccounts: Account[]) => {
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `mail_tm_accounts=${JSON.stringify(newAccounts)}; path=/; expires=${expires}; SameSite=Strict; Secure`;
  };

  const handleAddAccount = async () => {
    try {
      setIsLoading(true);
      const result = await loginMailTm(email, password);

      const newAccount: Account = {
        email,
        token: result.token,
        label: email.split("@")[0],
      };

      const newAccounts = [...accounts, newAccount];
      setAccounts(newAccounts);
      saveAccounts(newAccounts);
      setSelectedAccount(newAccount);

      // Set the current active token
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `mail_tm_token=${result.token}; path=/; expires=${expires}; SameSite=Strict; Secure`;
      document.cookie = `mail_tm_account=${JSON.stringify({
        id: result.account.id,
        email,
      })}; path=/; expires=${expires}; SameSite=Strict; Secure`;

      setShowNewAccountDialog(false);
      setEmail("");
      setPassword("");
      toast.success("Account added successfully!");

      // Refresh the page to load the new account's emails
      window.location.reload();
    } catch (error) {
      toast.error("Failed to add account. Please check your credentials.");
      console.error("Error adding account:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const switchAccount = (account: Account) => {
    setSelectedAccount(account);
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `mail_tm_token=${account.token}; path=/; expires=${expires}; SameSite=Strict; Secure`;
    document.cookie = `mail_tm_account=${JSON.stringify({
      email: account.email,
    })}; path=/; expires=${expires}; SameSite=Strict; Secure`;
    setOpen(false);
    // Refresh the page to load the selected account's emails
    window.location.reload();
  };

  return (
    <Dialog open={showNewAccountDialog} onOpenChange={setShowNewAccountDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select account"
            className="w-full justify-between"
          >
            <div className="flex items-center truncate">
              {selectedAccount?.email ?? "Select account"}
            </div>
            <CaretSortIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search accounts..." />
              <CommandEmpty>No accounts found.</CommandEmpty>
              <CommandGroup heading="Accounts">
                {accounts.map((account) => (
                  <CommandItem
                    key={account.email}
                    onSelect={() => switchAccount(account)}
                    className="text-sm"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {account.email}
                      {selectedAccount?.email === account.email && (
                        <CheckIcon className="ml-auto h-4 w-4 shrink-0 opacity-50" />
                      )}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false)
                      setShowNewAccountDialog(true)
                    }}
                  >
                    <PlusCircledIcon className="mr-2 h-5 w-5" />
                    Add Account
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Account</DialogTitle>
          <DialogDescription>
            Add a Mail.tm account to manage multiple inboxes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2 pb-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              placeholder="username@mail.tm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowNewAccountDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleAddAccount} disabled={isLoading}>
            {isLoading ? "Adding..." : "Add Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

