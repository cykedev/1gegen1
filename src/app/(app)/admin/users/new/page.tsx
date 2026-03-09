import { UserCreateForm } from "@/components/app/users/UserCreateForm"

export default function NewUserPage() {
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="mb-6 text-2xl font-semibold">Neuer Nutzer</h1>
      <UserCreateForm />
    </div>
  )
}
