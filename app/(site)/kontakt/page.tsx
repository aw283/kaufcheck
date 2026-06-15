"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function KontaktPage() {
  return (
    <Suspense fallback={null}>
      <KontaktInner />
    </Suspense>
  );
}

function KontaktInner() {
  const params = useSearchParams();
  const [form, setForm] = useState({
    name: "",
    email: "",
    betreff: params.get("betreff") === "partnerschaft" ? "Partnerschaft" : "",
    nachricht: "",
  });
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/kontakt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-center justify-center px-5 py-16 text-center">
        <CheckCircle2 className="h-12 w-12 text-success" aria-hidden />
        <h1 className="mt-4 text-3xl">Nachricht angekommen</h1>
        <p className="mt-2 text-muted-foreground">
          Wir melden uns in der Regel innerhalb eines Werktags.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-5 py-10 sm:py-14">
      <h1 className="text-4xl sm:text-5xl">Kontakt</h1>
      <p className="mt-3 text-muted-foreground">
        Fragen, Feedback, Presse oder Partnerschaft — schreiben Sie uns.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 space-y-4 rounded-xl border bg-surface p-6 shadow-sm"
        noValidate
      >
        <div className="space-y-2">
          <Label htmlFor="k-name">Name</Label>
          <Input
            id="k-name"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="k-email">E-Mail</Label>
          <Input
            id="k-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="k-betreff">Betreff</Label>
          <Input
            id="k-betreff"
            required
            value={form.betreff}
            onChange={(e) => setForm({ ...form, betreff: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="k-msg">Nachricht</Label>
          <textarea
            id="k-msg"
            required
            rows={6}
            value={form.nachricht}
            onChange={(e) => setForm({ ...form, nachricht: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          />
        </div>
        {state === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            Senden fehlgeschlagen — bitte erneut versuchen.
          </p>
        ) : null}
        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={state === "busy"}
        >
          {state === "busy" ? (
            <>
              <Loader2 className="animate-spin" aria-hidden /> Wird gesendet …
            </>
          ) : (
            "Nachricht senden"
          )}
        </Button>
      </form>
    </main>
  );
}
