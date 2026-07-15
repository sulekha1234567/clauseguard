"use client";

import { FileUp, Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Mode = "upload" | "paste";

export function NewContractForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("upload");
  const [submitting, setSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [contractType, setContractType] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please give this contract a title.");
      return;
    }
    setSubmitting(true);

    try {
      let res: Response;
      if (mode === "upload") {
        if (!file) {
          toast.error("Choose a PDF or text file to analyze.");
          setSubmitting(false);
          return;
        }
        const fd = new FormData();
        fd.append("title", title);
        if (contractType) fd.append("contractType", contractType);
        fd.append("file", file);
        res = await fetch("/api/contracts", { method: "POST", body: fd });
      } else {
        res = await fetch("/api/contracts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title, contractType, text }),
        });
      }

      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error?.message ?? "Analysis failed.");
        return;
      }

      toast.success("Contract analyzed!");
      router.push(`/dashboard/contracts/${json.data.id}`);
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5 text-primary" aria-hidden="true" />
          Analyze a new contract
        </CardTitle>
        <CardDescription>
          PDF or plain text, up to 5 MB. Your document stays private to your
          account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          role="tablist"
          aria-label="Input method"
          className="mb-4 inline-flex rounded-md border border-border p-1"
        >
          {(["upload", "paste"] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              type="button"
              onClick={() => setMode(m)}
              className={`rounded px-3 py-1.5 text-sm font-medium transition ${
                mode === m
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "upload" ? "Upload file" : "Paste text"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Apartment lease 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Type (optional)</Label>
              <Input
                id="type"
                value={contractType}
                onChange={(e) => setContractType(e.target.value)}
                placeholder="Lease, NDA, freelance…"
              />
            </div>
          </div>

          {mode === "upload" ? (
            <div className="space-y-2">
              <Label htmlFor="file">Contract file (PDF or .txt)</Label>
              <Input
                id="file"
                type="file"
                accept="application/pdf,text/plain"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm file:text-secondary-foreground"
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="text">Contract text</Label>
              <Textarea
                id="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste the full contract text here…"
                className="min-h-40"
              />
            </div>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Analyzing…
              </>
            ) : (
              <>
                <FileUp className="size-4" />
                Analyze contract
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
