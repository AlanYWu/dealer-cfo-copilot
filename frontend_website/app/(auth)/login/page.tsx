import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen grid place-items-center bg-neutral-50">
      <div className="w-full max-w-sm p-8 bg-white rounded-lg border border-neutral-200 shadow-sm">
        <h1 className="text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-sm text-neutral-600 mb-6">RAG Workspace</p>
        <LoginForm />
        <p className="mt-6 text-sm text-neutral-600">
          No account? <Link className="text-brand-600 hover:underline" href="/signup">Create one</Link>
        </p>
      </div>
    </main>
  );
}
