"use client";

import { Check, Loader2, Pencil, RefreshCw, Trash2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ContractActions({
  id,
  title,
  status,
}: {
  id: string;
  title: string;
  status: "processing" | "analyzed" | "failed";
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(title);
  const [busy, setBusy] = useState<"save" | "delete" | "reanalyze" | null>(null);

  async function save() {
    if (value.trim().length < 2) {
      toast.error("Title must be at least 2 characters.");
      return;
    }
    setBusy("save");
    const res = await fetch(`/api/contracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: value.trim() }),
    });
    setBusy(null);
    if (!res.ok) {
      toast.error("Could not rename.");
      return;
    }
    toast.success("Renamed.");
    setEditing(false);
    router.refresh();
  }

  async function reanalyze() {
    setBusy("reanalyze");
    const res = await fetch(`/api/contracts/${id}/reanalyze`, {
      method: "POST",
    });
    setBusy(null);
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      toast.error(json?.error?.message ?? "Re-analysis failed.");
      return;
    }
    toast.success("Re-analyzed.");
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this contract and its analysis permanently?")) return;
    setBusy("delete");
    const res = await fetch(`/api/contracts/${id}`, { method: "DELETE" });
    setBusy(null);
    if (!res.ok) {
      toast.error("Could not delete.");
      return;
    }
    toast.success("Deleted.");
    router.push("/dashboard");
    router.refresh();
  }

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-9 w-64"
          aria-label="Contract title"
          autoFocus
        />
        <Button size="icon" onClick={save} disabled={busy === "save"}>
          {busy === "save" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Check className="size-4" />
          )}
          <span className="sr-only">Save</span>
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={() => {
            setValue(title);
            setEditing(false);
          }}
        >
          <X className="size-4" />
          <span className="sr-only">Cancel</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
        <Pencil className="size-4" /> Rename
      </Button>
      {status !== "processing" && (
        <Button
          variant="outline"
          size="sm"
          onClick={reanalyze}
          disabled={busy === "reanalyze"}
        >
          {busy === "reanalyze" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <RefreshCw className="size-4" />
          )}
          Re-analyze
        </Button>
      )}
      <Button
        variant="destructive"
        size="sm"
        onClick={remove}
        disabled={busy === "delete"}
      >
        {busy === "delete" ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Trash2 className="size-4" />
        )}
        Delete
      </Button>
    </div>
  );
}
