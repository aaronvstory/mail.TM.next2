import { Mail } from "lucide-react"

export function Logo() {
  return (
    <div className="flex items-center space-x-2">
      <Mail className="h-6 w-6 text-primary" />
      <span className="text-xl font-semibold">@TempMail</span>
    </div>
  )
}

