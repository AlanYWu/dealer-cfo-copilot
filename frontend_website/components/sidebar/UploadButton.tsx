"use client";

import { useState, type ChangeEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { uploadPdf } from "@/lib/rag/client";

export function UploadButton({ folder }: { folder: string }) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onChange(e: ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    setErr(null);
    try {
      for (const f of Array.from(files)) {
        await uploadPdf(folder, f);
      }
      await qc.invalidateQueries({ queryKey: ["documents"] });
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <label className="inline-flex items-center text-xs text-brand-600 hover:underline cursor-pointer">
      <input
        type="file"
        accept="application/pdf"
        multiple
        hidden
        onChange={onChange}
        disabled={uploading}
      />
      {uploading ? "Uploading…" : "+ Upload PDF"}
      {err && <span className="ml-2 text-red-600">{err}</span>}
    </label>
  );
}
