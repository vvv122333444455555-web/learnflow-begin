import { authorizeWorkspace } from "@/lib/workspace-guard";
import { pageHead } from "@/lib/page-head";
import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/checkout")({
  beforeLoad: () => authorizeWorkspace(["student", "teacher", "admin"]),
  head: () => pageHead("الدفع غير متاح", "الدفع غير متاح في منصة LearnFlow لتعلم اللغات."),
  validateSearch: z.object({ plan: z.enum(["basic", "monthly", "yearly"]).default("basic") }),
  component: CheckoutPage,
});

function CheckoutPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-2xl space-y-5 p-6 sm:p-10" dir="rtl">
        <Lock className="h-8 w-8 text-primary" />
        <h1 className="text-2xl font-bold">الدفع غير متاح حاليًا</h1>
        <p className="text-muted-foreground">لن تُخصم أي مبالغ ولن يُفعّل اشتراك جديد حتى تصبح خدمة الدفع الآمن متاحة. اشتراكاتك الحالية محفوظة.</p>
        <Button asChild variant="outline"><Link to="/invoices">فواتيري</Link></Button>
      </main>
    </AppShell>
  );
}
