// Supabase Edge Function: generate-image
// Generates a simple, kid-safe illustration for a flashcard word using
// Gemini's image model (free tier). The prompt is always built by the
// server from a short word/phrase — the caller never controls the raw
// prompt text sent to the model, which keeps output predictable and safe.
// Only teachers may call this (checked via has_role).

import { createClient } from "jsr:@supabase/supabase-js@2";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MAX_WORD_LEN = 60;

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

    // Only teachers can generate images (this is a content-authoring tool, not a student-facing one).
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    if (!roles?.some((r: any) => r.role === "teacher")) {
      return new Response(JSON.stringify({ error: "Teachers only" }), { status: 403, headers: CORS_HEADERS });
    }

    const { word } = await req.json();
    if (typeof word !== "string" || !word.trim()) {
      return new Response(JSON.stringify({ error: "Empty word" }), { status: 400, headers: CORS_HEADERS });
    }
    if (word.length > MAX_WORD_LEN) {
      return new Response(JSON.stringify({ error: "الكلمة طويلة جدًا" }), { status: 400, headers: CORS_HEADERS });
    }

    // The server builds the entire prompt — the word is only ever inserted as a
    // plain noun phrase inside a fixed, safe template. This is what keeps
    // automatic (no-human-review) generation reasonably safe for a kids platform.
    const safeWord = word.replace(/[^\p{L}\p{N}\s'-]/gu, "").trim().slice(0, MAX_WORD_LEN);
    const prompt = `A simple, friendly, colorful cartoon illustration for a children's vocabulary flashcard depicting: "${safeWord}". Flat design, clean background, no text or letters in the image, safe and appropriate for young children, cheerful style.`;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Image generation is not configured yet (missing API key)" }), { status: 503, headers: CORS_HEADERS });
    }

    const aiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": apiKey },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["IMAGE"] },
        }),
      },
    );

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("Gemini image API error:", aiRes.status, errText);
      return new Response(JSON.stringify({ error: "تعذر توليد الصورة، حاول مرة أخرى" }), { status: 502, headers: CORS_HEADERS });
    }

    const aiData = await aiRes.json();
    const part = aiData.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
    if (!part?.inlineData?.data) {
      return new Response(JSON.stringify({ error: "لم يتم توليد صورة، جرّب كلمة أخرى" }), { status: 502, headers: CORS_HEADERS });
    }

    const mime = part.inlineData.mimeType || "image/png";
    const dataUrl = `data:${mime};base64,${part.inlineData.data}`;

    return new Response(JSON.stringify({ image: dataUrl }), {
      headers: { ...CORS_HEADERS, "content-type": "application/json" },
    });
  } catch (e) {
    console.error("generate-image function error:", e);
    return new Response(JSON.stringify({ error: "خطأ غير متوقع" }), { status: 500, headers: CORS_HEADERS });
  }
});
