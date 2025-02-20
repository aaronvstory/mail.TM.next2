import { AuthForm } from "@/components/auth/auth-form"

export default function AuthPage({
  searchParams,
}: {
  searchParams: { type?: string }
}) {
  const type = searchParams.type === "register" ? "register" : "login"

  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {type === "login" ? "Welcome back" : "Create an account"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {type === "login"
              ? "Enter your email to sign in to your account"
              : "Enter your email below to create your account"}
          </p>
        </div>
        <AuthForm type={type} />
      </div>
    </div>
  )
}

