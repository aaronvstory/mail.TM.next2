"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createMailTmAccount,
  getAvailableDomains,
  loginMailTm,
  type Domain,
} from "@/lib/mail-tm/client";
import Link from "next/link";

const registerSchema = z.object({
  username: z
    .string()
    .min(3, {
      message: "Username must be at least 3 characters.",
    })
    .regex(/^[a-zA-Z0-9_-]+$/, {
      message:
        "Username can only contain letters, numbers, underscores, and hyphens.",
    }),
  domain: z.string({
    required_error: "Please select a domain",
  }),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

const loginSchema = z.object({
  email: z.string().min(1, "Email is required"),
  password: z.string().min(6, {
    message: "Password must be at least 6 characters.",
  }),
});

interface AuthFormProps {
  type: "login" | "register";
}

export function AuthForm({ type }: AuthFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [domains, setDomains] = React.useState<Domain[]>([]);

  React.useEffect(() => {
    async function fetchDomains() {
      try {
        const availableDomains = await getAvailableDomains();
        const activeDomains = availableDomains.filter(
          (domain) => domain.isActive
        );
        setDomains(activeDomains);
        if (activeDomains.length > 0) {
          registerForm.setValue("domain", activeDomains[0].domain);
        }
      } catch (error) {
        console.error("Failed to fetch domains:", error);
        toast.error("Failed to fetch available domains");
      }
    }
    if (type === "register") {
      fetchDomains();
    }
  }, [type]);

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      domain: "",
      password: "",
    },
  });

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onRegister(values: z.infer<typeof registerSchema>) {
    try {
      setIsLoading(true);
      const account = await createMailTmAccount(
        values.username,
        values.password,
        values.domain
      );
      console.log("Mail.tm account created:", account);

      // Log in immediately after creating account
      const loginData = await loginMailTm(
        `${values.username}@${values.domain}`,
        values.password
      );
      if (loginData.token) {
        document.cookie = `mail_tm_token=${loginData.token}; path=/;`;
        document.cookie = `mail_tm_account=${JSON.stringify({
          id: loginData.id,
          email: `${values.username}@${values.domain}`,
        })}; path=/;`;
        toast.success(
          `Temporary email ${values.username}@${values.domain} created successfully!`
        );
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Registration error:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during registration"
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function onLogin(values: z.infer<typeof loginSchema>) {
    try {
      setIsLoading(true);
      const email = values.email.includes("@")
        ? values.email
        : `${values.email}@mail.tm`;

      const loginData = await loginMailTm(email, values.password);
      if (loginData.token) {
        document.cookie = `mail_tm_token=${loginData.token}; path=/;`;
        document.cookie = `mail_tm_account=${JSON.stringify({
          id: loginData.id,
          email,
        })}; path=/;`;
        toast.success("Logged in successfully!");
        router.push("/dashboard");
      }
    } catch (error) {
      console.error("Login error:", error);
      toast.error("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  }

  if (type === "register") {
    return (
      <Form {...registerForm}>
        <form
          onSubmit={registerForm.handleSubmit(onRegister)}
          className="space-y-6"
        >
          <FormField
            control={registerForm.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input placeholder="username" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={registerForm.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Domain</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a domain" />
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {domains.map((domain) => (
                      <SelectItem key={domain.id} value={domain.domain}>
                        @{domain.domain}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={registerForm.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Account..." : "Create Temporary Email"}
          </Button>
        </form>
      </Form>
    );
  }

  return (
    <Form {...loginForm}>
      <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-6">
        <FormField
          control={loginForm.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email Address</FormLabel>
              <FormControl>
                <Input placeholder="username@domain.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={loginForm.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing In..." : "Sign In"}
          </Button>
          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/register">Create New Account</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
