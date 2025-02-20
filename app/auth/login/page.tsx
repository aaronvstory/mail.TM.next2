import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Login - Temporary Email",
  description: "Access your temporary email account",
};

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Logo />
          <h1 className="text-2xl font-semibold tracking-tight">
            Temporary Email Service
          </h1>
          <p className="text-sm text-muted-foreground">
            Access or create a disposable email address
          </p>
        </div>
        <div className="flex flex-col gap-4">
          <Button asChild variant="default" className="w-full">
            <Link href="/auth/register">Create New Email Account</Link>
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t"></span>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or
              </span>
            </div>
          </div>
          <AuthForm type="login" />
        </div>
      </div>
    </div>
  );
}
