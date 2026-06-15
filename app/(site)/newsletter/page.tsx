import type { Metadata } from "next";

import { NewsletterForm } from "@/components/newsletter-form";

export const metadata: Metadata = {
  title: "Newsletter",
  description:
    "Markt-Updates, Förderungs-News und Leistbarkeits-Wissen für Österreich — unregelmäßig, dafür relevant. Jederzeit abbestellbar.",
  alternates: { canonical: "/newsletter" },
};

export default function NewsletterPage() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-5 py-16">
      <h1 className="text-4xl sm:text-5xl">Der immoampel-Newsletter</h1>
      <p className="mt-4 text-muted-foreground">
        Kein wöchentlicher Spam. Wir schreiben, wenn sich etwas ändert, das
        Ihre Kaufentscheidung betrifft: Zinsbewegungen, neue Förderprogramme,
        KIM-V-Updates. Abbestellen jederzeit mit einem Klick.
      </p>
      <div className="mt-8">
        <NewsletterForm />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Mit der Anmeldung stimmen Sie dem Empfang des Newsletters zu. Details
        im Datenschutzhinweis.
      </p>
    </main>
  );
}
