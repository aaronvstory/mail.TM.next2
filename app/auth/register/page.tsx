import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";
import { Logo } from "@/components/logo";

export const metadata = {
  title: "Create Temporary Email",
  description: "Create a disposable email address for temporary use",
};

export default function RegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <Logo />
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Temporary Email
          </h1>
          <p className="text-sm text-muted-foreground">
            Create a disposable email address using any available domain
          </p>
        </div>
        <AuthForm type="register" />
        <p className="px-8 text-center text-sm text-muted-foreground">
          <Link
            href="/auth/login"
            className="hover:text-brand underline underline-offset-4"
          >
            Have an existing temporary email? Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
