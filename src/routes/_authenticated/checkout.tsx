import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { toast } from "sonner";
import { Lock, Loader2, CheckCircle2, Download, CreditCard, Smartphone, ShieldCheck } from "lucide-react";
import { generateInvoicePDF } from "@/lib/invoice-pdf";

const searchSchema = z.object({ plan: z.enum(["basic", "monthly", "yearly"]).default("basic") });

export const Route = createFileRoute("/_authenticated/checkout")({
  head: () => ({ meta: [{ title: "إتمام الدفع | منصة اللغات" }] }),
  validateSearch: searchSchema,
  component: CheckoutPage,
});

const PLAN_DETAILS: Record<"basic" | "monthly" | "yearly", { name: string; price: number; period: string; days: number; tier: "basic" | "premium" }> = {
  basic: { name: "اشتراك أساسي (تمارين)", price: 9, period: "شهر", days: 30, tier: "basic" },
  monthly: { name: "اشتراك Premium شهري", price: 49, period: "شهر", days: 30, tier: "premium" },
  yearly: { name: "اشتراك Premium سنوي", price: 399, period: "سنة", days: 365, tier: "premium" },
};

type Profile = { full_name: string | null; email: string | null };
type Method = "flouci" | "card" | "gpg";

function CheckoutPage() {
  const search = Route.useSearch() as { plan: "basic" | "monthly" | "yearly" };
  const plan = search.plan;
  const navigate = useNavigate();
  const detail = PLAN_DETAILS[plan];

  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [method, setMethod] = useState<Method>("flouci");
  const [phone, setPhone] = useState("");
  const [card, setCard] = useState({ number: "", expiry: "", cvc: "" });
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState<null | { invoiceNo: string; ref: string }>(null);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setUserId(u.user.id);
      const { data: p } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", u.user.id)
        .maybeSingle();
      setProfile(p as Profile);
    })();
  }, []);

  const downloadInvoice = (invoiceNo: string, ref: string) => {
    generateInvoicePDF({
      invoiceNo,
      date: new Date().toLocaleDateString("en-GB"),
      customerName: profile?.full_name ?? "Customer",
      customerEmail: profile?.email ?? "",
      plan: detail.name,
      amount: detail.price,
      currency: "TND",
      provider: method.toUpperCase(),
      providerRef: ref,
    });
  };

  const pay = async () => {
    if (!userId) return;
    if (method === "flouci" && !/^\+?\d{8,}$/.test(phone.replace(/\s/g, ""))) {
      toast.error("أدخل رقم هاتف صحيح");
      return;
    }
    if (method === "card" && (card.number.replace(/\s/g, "").length < 12 || !card.expiry || card.cvc.length < 3)) {
      toast.error("بيانات البطاقة غير مكتملة");
      return;
    }
    setProcessing(true);

    // Simulate Flouci/GPG gateway call
    await new Promise((r) => setTimeout(r, 1600));
    const providerRef = `${method.toUpperCase()}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;

    // Server-side controlled activation: creates invoice + flips the right tier atomically
    const { data: rpc, error: rpcErr } = detail.tier === "basic"
      ? await supabase.rpc("activate_basic_subscription", {
          _amount: detail.price,
          _currency: "TND",
          _provider: method,
          _provider_ref: providerRef,
          _days: detail.days,
        })
      : await supabase.rpc("activate_premium", {
          _plan: detail.name,
          _amount: detail.price,
          _currency: "TND",
          _provider: method,
          _provider_ref: providerRef,
          _days: detail.days,
        });

    setProcessing(false);
    if (rpcErr || !rpc || (Array.isArray(rpc) && rpc.length === 0)) {
      toast.error(rpcErr?.message ?? "فشلت عملية الدفع");
      return;
    }
    const row = Array.isArray(rpc) ? rpc[0] : rpc;
    const invoiceNo = String(row.invoice_id).slice(0, 8).toUpperCase();
    setDone({ invoiceNo, ref: providerRef });
    toast.success(detail.tier === "basic" ? "تم الدفع بنجاح! فُتحت لك كل التمارين 🎉" : "تم الدفع بنجاح! أصبحت عضوًا مميّزًا 🎉");
    setTimeout(() => downloadInvoice(invoiceNo, providerRef), 400);
  };

  if (done) {
    return (
      <AppShell>
        <div className="max-w-2xl mx-auto p-6 sm:p-10" dir="rtl">
          <div className="rounded-3xl border border-border bg-card p-10 text-center" style={{ boxShadow: "var(--shadow-elegant)" }}>
            <div className="w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center text-white" style={{ background: "var(--gradient-hero)" }}>
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold mb-2">تم الدفع بنجاح</h1>
            <p className="text-muted-foreground mb-6">
              {detail.tier === "basic"
                ? "أهلاً بك! أصبح بإمكانك الوصول لكامل مكتبة التمارين على المنصة."
                : "أهلاً بك في عضوية Premium. أصبح بإمكانك الوصول لكل المحتوى وحجز الجلسات الحيّة."}
            </p>
            <div className="rounded-2xl bg-muted p-4 mb-6 text-sm space-y-1 text-right">
              <div className="flex justify-between"><span className="text-muted-foreground">رقم الفاتورة</span><span className="font-mono font-semibold">#{done.invoiceNo}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المرجع</span><span className="font-mono text-xs">{done.ref}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">المبلغ</span><span className="font-semibold">{detail.price.toFixed(2)} د.ت</span></div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => downloadInvoice(done.invoiceNo, done.ref)}
                className="flex-1 px-5 py-3 rounded-xl border-2 border-border font-semibold inline-flex items-center justify-center gap-2 hover:bg-muted"
              >
                <Download className="w-4 h-4" /> تحميل الفاتورة PDF
              </button>
              <button
                onClick={() => navigate({ to: "/dashboard" })}
                className="flex-1 px-5 py-3 rounded-xl font-semibold text-primary-foreground"
                style={{ background: "var(--gradient-hero)" }}
              >
                إلى لوحتي
              </button>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto p-6 sm:p-10 grid md:grid-cols-[1fr_360px] gap-6" dir="rtl">
        {/* Payment form */}
        <div className="rounded-3xl border border-border bg-card p-6 sm:p-8" style={{ boxShadow: "var(--shadow-soft)" }}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/15 text-accent-foreground text-xs font-medium mb-4">
            <Lock className="w-3.5 h-3.5" /> دفع آمن ومشفّر
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-6">إتمام الدفع</h1>

          <div className="mb-6">
            <div className="text-sm font-semibold mb-3">طريقة الدفع</div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "flouci" as Method, label: "Flouci", icon: Smartphone },
                { id: "card" as Method, label: "بطاقة", icon: CreditCard },
                { id: "gpg" as Method, label: "GPG", icon: ShieldCheck },
              ].map((m) => {
                const I = m.icon;
                const active = method === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMethod(m.id)}
                    className={`p-3 rounded-xl border-2 text-sm font-semibold flex flex-col items-center gap-1.5 transition ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"
                    }`}
                  >
                    <I className="w-5 h-5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {method === "flouci" && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">رقم الهاتف (Flouci)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+216 XX XXX XXX"
                className="w-full px-4 py-3 rounded-xl border border-border bg-background"
                dir="ltr"
              />
              <p className="text-xs text-muted-foreground">سيتم إرسال طلب تأكيد إلى تطبيق Flouci على هاتفك.</p>
            </div>
          )}

          {method === "card" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">رقم البطاقة</label>
                <input
                  value={card.number}
                  onChange={(e) => setCard({ ...card, number: e.target.value })}
                  placeholder="4242 4242 4242 4242"
                  className="w-full px-4 py-3 rounded-xl border border-border bg-background font-mono"
                  dir="ltr"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">تاريخ الانتهاء</label>
                  <input
                    value={card.expiry}
                    onChange={(e) => setCard({ ...card, expiry: e.target.value })}
                    placeholder="MM/YY"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background font-mono"
                    dir="ltr"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">CVC</label>
                  <input
                    value={card.cvc}
                    onChange={(e) => setCard({ ...card, cvc: e.target.value })}
                    placeholder="123"
                    className="w-full px-4 py-3 rounded-xl border border-border bg-background font-mono"
                    dir="ltr"
                    maxLength={4}
                  />
                </div>
              </div>
            </div>
          )}

          {method === "gpg" && (
            <div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">
              ستتم إعادة توجيهك إلى بوابة GPG لإتمام عملية الدفع (محاكاة).
            </div>
          )}

          <button
            onClick={pay}
            disabled={processing}
            className="w-full mt-6 px-6 py-3.5 rounded-xl font-bold text-primary-foreground inline-flex items-center justify-center gap-2 disabled:opacity-60"
            style={{ background: "var(--gradient-hero)", boxShadow: "var(--shadow-elegant)" }}
          >
            {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري المعالجة...</> : <><Lock className="w-4 h-4" /> ادفع {detail.price.toFixed(2)} د.ت</>}
          </button>
        </div>

        {/* Summary */}
        <aside className="rounded-3xl border border-border bg-card p-6 h-fit sticky top-6" style={{ boxShadow: "var(--shadow-soft)" }}>
          <h2 className="font-bold mb-4">ملخّص الطلب</h2>
          <div className="space-y-2 text-sm pb-4 border-b border-border">
            <div className="flex justify-between"><span className="text-muted-foreground">الخطة</span><span className="font-semibold">{detail.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">المدة</span><span className="font-semibold">{detail.period}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">السعر</span><span>{detail.price.toFixed(2)} د.ت</span></div>
          </div>
          <div className="flex justify-between font-bold text-lg pt-4 mb-4">
            <span>الإجمالي</span>
            <span>{detail.price.toFixed(2)} د.ت</span>
          </div>
          <Link to="/upgrade" className="text-xs text-primary hover:underline">← تغيير الخطة</Link>
        </aside>
      </div>
    </AppShell>
  );
}
