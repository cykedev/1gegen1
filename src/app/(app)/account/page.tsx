import { AccountPasswordForm } from "@/components/app/account/AccountPasswordForm"

export default function AccountPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-1 text-2xl font-semibold">Mein Konto</h1>
      <p className="mb-6 text-sm text-muted-foreground">Passwort ändern</p>
      <AccountPasswordForm />
    </div>
  )
}
