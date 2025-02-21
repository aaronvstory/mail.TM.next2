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
        const account = await createMailTmAccount(
          username,
          password,
          availableDomain
        );
        console.log("Account created:", account);
        toast.success("Account created successfully!");
        router.push("/auth/login");
      } else {
        const loginData = await loginMailTm(username, password);
        if (loginData.token) {
          document.cookie = `mail_tm_token=${loginData.token}; path=/;`;
          document.cookie = `mail_tm_account=${JSON.stringify({
            id: loginData.id,
            email: username,
          })}; path=/;`;
          toast.success("Logged in successfully!");
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error(
        type === "register" ? "Registration error:" : "Login error:",
        error
      );
      toast.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type === "login" ? "Login" : "Create Account"}</CardTitle>
        <CardDescription>
          {type === "login"
            ? "Access your temporary email"
            : "Create a new temporary email"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">
              {type === "login" ? "Email" : "Username"}
            </Label>
            <Input
              id="username"
              placeholder={type === "login" ? "email@example.com" : "username"}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
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
              ? type === "login"
                ? "Signing in..."
                : "Creating account..."
              : type === "login"
              ? "Sign in"
              : "Create account"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
