"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  createMailTmAccount,
  loginMailTm,
  getAvailableDomains,
} from "@/lib/mail-tm/client";

interface AuthFormProps {
  type: "login" | "register";
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [availableDomain, setAvailableDomain] = React.useState<string>("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");

  React.useEffect(() => {
    if (type === "register") {
      const fetchDomain = async () => {
        try {
          const domains = await getAvailableDomains();
          if (domains && domains.length > 0) {
            setAvailableDomain(domains[0].domain);
          }
        } catch (error) {
          console.error("Failed to fetch domains:", error);
          toast.error("Failed to fetch available domains");
        }
      };
      fetchDomain();
    }
  }, [type]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (type === "register") {
        if (!availableDomain) {
          throw new Error("No domain available");
        }

        await createMailTmAccount(username, password, availableDomain);
        toast.success("Account created successfully!");
      }

      const email =
        type === "register" ? `${username}@${availableDomain}` : username;
      await loginMailTm(email, password);

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      console.error("Authentication error:", error);
      toast.error(
        type === "register"
          ? "Failed to create account. Please try a different username."
          : "Invalid email or password"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {type === "login" ? "Sign In" : "Create Account"}
          </CardTitle>
          <CardDescription>
            {type === "login"
              ? "Access your temporary email account"
              : `Create a new email account at ${
                  availableDomain || "loading domain..."
                }`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">
              {type === "login" ? "Email Address" : "Username"}
            </Label>
            <div className="flex">
              <Input
                id="email"
                type="text"
                placeholder={
                  type === "login" ? "email@example.com" : "username"
                }
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={type === "register" ? "rounded-r-none" : ""}
                required
              />
              {type === "register" && availableDomain && (
                <div className="flex items-center bg-muted px-3 rounded-r-md border border-l-0 border-input">
                  @{availableDomain}
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading
              ? "Please wait..."
              : type === "login"
              ? "Sign In"
              : "Create Account"}
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
