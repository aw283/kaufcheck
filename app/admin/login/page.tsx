"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AdminLoginPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}

function Inner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";

  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "error">("idle");
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (status === "submitting") return;
    setStatus("submitting");
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as
          | { error?: string }
          | null;
        setStatus("error");
        setError(data?.error ?? "Login fehlgeschlagen");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setStatus("error");
      setError("Login fehlgeschlagen");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Admin-Login</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Nur für autorisierten Zugriff.
          </p>
        </div>

        <Card>
          <CardContent className="px-5 py-6 sm:px-6">
            <form onSubmit={onSubmit} className="space-y-4" noValidate>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                  required
                />
              </div>
              {error ? (
                <p
                  role="alert"
                  className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  {error}
                </p>
              ) : null}
              <Button
                type="submit"
                className="w-full"
                disabled={status === "submitting" || password.length === 0}
              >
                {status === "submitting" ? "Wird geprüft …" : "Einloggen"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
