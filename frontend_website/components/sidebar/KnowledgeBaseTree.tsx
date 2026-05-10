"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Scope } from "@/lib/rag/contract";
import { fetchDocuments } from "@/lib/rag/client";
import { UploadButton } from "./UploadButton";

export function KnowledgeBaseTree(props: {
  scope: Scope;
  setScope: (s: Scope) => void;
}) {
  const { data } = useQuery({ queryKey: ["documents"], queryFn: fetchDocuments });
  const [newFolder, setNewFolder] = useState("");

  function toggleFolder(name: string) {
    const set = new Set(props.scope.folders ?? []);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    props.setScope({ ...props.scope, folders: Array.from(set) });
  }

  return (
    <div className="px-3 py-2 border-t border-neutral-200 mt-2">
      <div className="flex items-center justify-between mb-1">
        <div className="text-xs uppercase tracking-wider text-neutral-500">Knowledge Base</div>
      </div>
      {(!data || data.folders.length === 0) && (
        <p className="text-xs text-neutral-400 px-1 py-1">No documents yet.</p>
      )}
      <ul className="space-y-1">
        {data?.folders.map((f) => {
          const checked = (props.scope.folders ?? []).includes(f.name);
          return (
            <li key={f.name}>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleFolder(f.name)}
                />
                <span className="font-medium">{f.name}</span>
                <span className="text-xs text-neutral-400">({f.documents.length})</span>
              </label>
              <ul className="pl-6 text-xs text-neutral-600">
                {f.documents.map((d) => (
                  <li key={d.docId} className="truncate py-0.5" title={d.docName}>
                    {d.docName}
                  </li>
                ))}
              </ul>
              <div className="pl-6">
                <UploadButton folder={f.name} />
              </div>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex gap-2 items-center">
        <input
          className="text-xs border border-neutral-300 rounded px-2 py-1 w-28"
          placeholder="New folder"
          value={newFolder}
          onChange={(e) => setNewFolder(e.target.value)}
        />
        {newFolder.trim() && <UploadButton folder={newFolder.trim()} />}
      </div>
      {(props.scope.folders?.length ?? 0) > 0 && (
        <button
          onClick={() => props.setScope({})}
          className="mt-2 text-xs text-neutral-500 hover:text-neutral-800"
        >
          Clear scope
        </button>
      )}
    </div>
  );
}
