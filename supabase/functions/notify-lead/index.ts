import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;

serve(async (req) => {
  try {
    const { record } = await req.json();

    const lines = [
      "📸 *Новая заявка с сайта*",
      "",
      `👤 *Имя:* ${record.name || "—"}`,
      `📱 *Телефон:* ${record.phone || "—"}`,
      `📧 *Email:* ${record.email || "—"}`,
      `🎯 *Тип съёмки:* ${record.shoot_type || "—"}`,
      record.plan ? `💳 *Тариф:* ${record.plan}` : null,
      record.message ? `💬 *Сообщение:* ${record.message}` : null,
      "",
      `🕐 ${new Date(record.created_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}`,
    ].filter(Boolean).join("\n");

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: lines,
        parse_mode: "Markdown",
      }),
    });

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500 });
  }
});
