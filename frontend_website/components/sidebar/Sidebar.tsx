"use client";

import Link from "next/link";
import type { Scope } from "@/lib/rag/contract";
import { UserMenu } from "./UserMenu";
import { SessionList } from "./SessionList";
import { KnowledgeBaseTree } from "./KnowledgeBaseTree";

export function Sidebar(props: {
  username: string;
  scope: Scope;
  setScope: (s: Scope) => void;
}) {
  return (
    <div className="flex flex-col h-full">
      <UserMenu username={props.username} />
      <div className="px-3 py-2">
        <Link
          href="/dashboard"
          className="block w-full rounded bg-brand-600 text-white px-3 py-2 text-center text-sm font-medium hover:bg-brand-700"
        >
          + New search
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto">
        <SessionList />
        <KnowledgeBaseTree scope={props.scope} setScope={props.setScope} />
      </div>
    </div>
  );
}
