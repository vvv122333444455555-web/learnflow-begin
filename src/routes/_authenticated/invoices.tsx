import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { Download, Receipt, Loader2 } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

export const Route = createFileRoute("/_authenticated/invoices")({
  head: () => ({ meta: [{ title: "الفواتير | منصة اللغات" }] }),
  component: InvoicesPage,
});

type Invoice = {
  id: string;
  plan: string;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  provider_ref: string;
  created_at: string;
};

function InvoicesPage() {
  const [items, setItems] = useState<Invoice[]>([]);
  const [profile, setProfile] = useState<{ full_name: string | null; email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const [{ data: invs }, { data: p }] = await Promise.all([
        supabase.from("invoices").select("*").eq("user_id", u.user.id).order("created_at", { ascending: false }),
        supabase.from("profiles").select("full_name, email").eq("id", u.user.id).maybeSingle(),
      ]);
      setItems((invs as Invoice[]) ?? []);
      setProfile(p as { full_name: string | null; email: string | null } | null);
      setLoading(false);
    })();
  }, []);

  const download = (inv: Invoice) => {
    generateInvoicePDF({
      invoiceNo: inv.id.slice(0, 8).toUpperCase(),
      date: new Date(inv.created_at).toLocaleDateString("en-GB"),
      customerName: profile?.full_name ?? "Customer",
      customerEmail: profile?.email ?? "",
      plan: inv.plan,
      amount: Number(inv.amount),
      currency: inv.currency,
      provider: inv.provider.toUpperCase(),
      providerRef: inv.provider_ref,
    });
  };

  return (
    <AppShell>
      <div className="max-w-4xl mx-auto p-6 sm:p-10" dir="rtl">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><Receipt className="w-7 h-7" /> الفواتير</h1>
        <p className="text-muted-foreground mb-8">جميع مدفوعاتك في مكان واحد.</p>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-muted-foreground">
            لا توجد فواتير بعد.
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card overflow-hidden" style={{ boxShadow: "var(--shadow-soft)" }}>
            {items.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between p-5 border-b border-border last:border-b-0">
                <div>
                  <div className="font-semibold">{inv.plan}</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    #{inv.id.slice(0, 8).toUpperCase()} • {new Date(inv.created_at).toLocaleDateString("ar-EG", { day: "numeric", month: "long", year: "numeric" })} • {inv.provider.toUpperCase()}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-left">
                    <div className="font-bold">{Number(inv.amount).toFixed(2)} {inv.currency}</div>
                    <div className="text-xs text-emerald-600 font-medium">{inv.status === "paid" ? "مدفوع" : inv.status}</div>
                  </div>
                  <button onClick={() => download(inv)} className="p-2.5 rounded-lg border border-border hover:bg-muted" title="تحميل PDF">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
