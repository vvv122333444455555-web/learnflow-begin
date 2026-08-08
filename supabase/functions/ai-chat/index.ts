// Supabase Edge Function: ai-chat
// Proxies a chat message to the Anthropic API on behalf of the logged-in
// student (kid or adult), using a role-appropriate system prompt. The
// Anthropic API key never reaches the browser — it lives only as a
// Supabase secret (ANTHROPIC_API_KEY) read here on the server.

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_MESSAGE_LEN = 800;
const MAX_HISTORY = 12; // last N messages sent as context, keeps cost predictable

const KID_SYSTEM_PROMPT = `أنت "صديقي" مساعد تعليمي ودود لمنصة تعليم لغات تونسية موجه للأطفال.
قواعد صارمة يجب اتباعها دائمًا:
- تحدث بطريقة بسيطة، مرحة، ومشجعة، مناسبة لطفل بين 6 و14 سنة.
- ركّز فقط على تعلم اللغة (مفردات، قواعد بسيطة، محادثة تدريبية، ألعاب لغوية).
- لا تناقش أبدًا مواضيع للبالغين، عنف، مواعدة، أو أي محتوى غير مناسب للأطفال — حوّل الموضوع بلطف لموضوع تعليمي بدلاً من ذلك.
- لا تطلب أبدًا معلومات شخصية حساسة (عنوان، رقم هاتف، مدرسة بالتفصيل، صور).
- شجّع الطفل دائمًا، واستعمل رموز تعبيرية بسيطة لجعل المحادثة ممتعة.
- إذا شعرت أن الطفل يحتاج مساعدة من شخص بالغ (أي إشارة لضيق أو خطر)، انصحه بلطف بالتحدث لولي أمره أو معلمه.
- أجوبتك قصيرة (2-4 جمل كحد أقصى) لتناسب انتباه الطفل.`;

const ADULT_SYSTEM_PROMPT = `أنت مساعد محادثة لمنصة تعليم لغات تونسية موجهة للبالغين.
- ساعد المتعلم على ممارسة اللغة المستهدفة عبر محادثة طبيعية، وصحح أخطاءه بلطف مع شرح مختصر.
- تكيّف مع مستوى المتعلم (مبتدئ إلى متقدم) حسب أسلوبه في الكتابة.
- ابق ضمن سياق تعليم اللغة والمواضيع العامة المناسبة؛ تجنب المحتوى الحساس أو المثير للجدل.
- أجوبتك مركّزة ومفيدة، بدون إطالة غير ضرورية.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS_HEADERS });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: CORS_HEADERS });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), { status: 401, headers: CORS_HEADERS });
    }
    const userId = userData.user.id;

    const { message, history } = await req.json();
    if (typeof message !== "string" || !message.trim()) {
      return new Response(JSON.stringify({ error: "Empty message" }), { status: 400, headers: CORS_HEADERS });
    }
    if (message.length > MAX_MESSAGE_LEN) {
      return new Response(JSON.stringify({ error: "الرسالة طويلة جدًا" }), { status: 400, headers: CORS_HEADERS });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("track, account_type, full_name")
      .eq("id", userId)
      .maybeSingle();

    const isKid = profile?.track === "kids" && profile?.account_type === "child";
    const systemPrompt = isKid ? KID_SYSTEM_PROMPT : ADULT_SYSTEM_PROMPT;

    const trimmedHistory = Array.isArray(history) ? history.slice(-MAX_HISTORY) : [];
    const contents = [
      ...trimmedHistory.map((m: any) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: String(m.content ?? "").slice(0, MAX_MESSAGE_LEN) }],
      })),
      { role: "user", parts: [{ text: message }] },
    ];

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "AI chat is not configured yet (missing API key)" }), { status: 503, headers: CORS_HEADERS });
    }

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: 800, thinkingConfig: { thinkingBudget: 0 } },
        }),
      },
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Gemini API error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "تعذر الوصول للمساعد الذكي، حاول مرة أخرى" }), { status: 502, headers: CORS_HEADERS });
    }

    const aiData = await aiRes.json();
    const reply = aiData.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join("") ?? "";

    // Best-effort persistence for history/admin visibility — failures here shouldn't break the chat.
    await supabase.from("ai_chat_messages").insert([
      { user_id: userId, role: "user", content: message },
      { user_id: userId, role: "assistant", content: reply },
    ]).select().then(() => {}).catch(() => {});

    return new Response(JSON.stringify({ reply }), {
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("ai-chat function error:", e);
    return new Response(JSON.stringify({ error: "خطأ غير متوقع" }), { status: 500, headers: CORS_HEADERS });
  }
});
