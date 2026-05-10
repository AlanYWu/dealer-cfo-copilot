"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { fetchSessions } from "@/lib/rag/client";

export function SessionList() {
  const { data } = useQuery({
    queryKey: ["sessions"],
    queryFn: fetchSessions,
  });
  const pathname = usePathname();

  return (
    <div className="px-3 py-2">
      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Sessions</div>
      {data?.sessions.length === 0 && (
        <p className="text-xs text-neutral-400 px-2 py-1">No searches yet.</p>
      )}
      <ul className="space-y-0.5">
        {data?.sessions.map((s) => {
          const active = pathname === `/s/${s.id}`;
          return (
            <li key={s.id}>
              <Link
                href={`/s/${s.id}`}
                className={`block truncate rounded px-2 py-1 text-sm ${
                  active ? "bg-brand-50 text-brand-700" : "hover:bg-neutral-100"
                }`}
                title={s.query}
              >
                {s.query}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
