"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NewsletterForm({ compact = false }: { compact?: boolean }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      setState(res.ok ? "done" : "error");
    } catch {
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <p className="text-sm font-medium text-success">
        Danke! Sie hören von uns, wenn es etwas Relevantes gibt.
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-md gap-2" noValidate>
      <label htmlFor={compact ? "nl-compact" : "nl-email"} className="sr-only">
        E-Mail-Adresse
      </label>
      <Input
        id={compact ? "nl-compact" : "nl-email"}
        type="email"
        inputMode="email"
        required
        placeholder="ihre@email.at"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-surface"
      />
      <Button type="submit" disabled={state === "busy" || !email.includes("@")}>
        {state === "busy" ? "…" : "Anmelden"}
      </Button>
      {state === "error" ? (
        <span role="alert" className="sr-only">
          Anmeldung fehlgeschlagen
        </span>
      ) : null}
    </form>
  );
}
