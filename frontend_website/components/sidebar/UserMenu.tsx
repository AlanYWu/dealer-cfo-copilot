"use client";

import { useRouter } from "next/navigation";

export function UserMenu({ username }: { username: string }) {
  const router = useRouter();
  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }
  return (
    <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-200">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-brand-500 text-white grid place-items-center text-xs font-semibold">
          {username.slice(0, 1).toUpperCase()}
        </div>
        <span className="text-sm font-medium">{username}</span>
      </div>
      <button onClick={onLogout} className="text-xs text-neutral-500 hover:text-neutral-800">
        Log out
      </button>
    </div>
  );
}
