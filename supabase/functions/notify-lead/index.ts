import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const CHAT_ID = Deno.env.get("TELEGRAM_CHAT_ID")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const ALERT_EMAIL = Deno.env.get("ALERT_EMAIL") || "olegpyitsyn@yandex.ru";

serve(async (req) => {
  try {
    const body = await req.json();
    const record = body.record ?? body;

    const lines = [
      "📸 Новая заявка с сайта",
      "",
      `👤 Имя: ${record.name || "—"}`,
      `📱 Телефон: ${record.phone || "—"}`,
      `📧 Email: ${record.email || "—"}`,
      `🎯 Тип съёмки: ${record.shoot_type || "—"}`,
      record.plan ? `💳 Тариф: ${record.plan}` : null,
      record.source ? `📌 Источник: ${record.source}` : null,
      record.message ? `💬 Сообщение: ${record.message}` : null,
      "",
      `🕐 ${new Date(record.created_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}`,
    ].filter(Boolean).join("\n");

    // Telegram — plain text, no parse_mode to avoid Markdown errors
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: CHAT_ID, text: lines }),
    });
    if (!tgRes.ok) {
      console.error("[notify-lead] Telegram error:", tgRes.status, await tgRes.text());
    }

    // Email через Resend
    if (RESEND_API_KEY) {
      const html = `
        <h2>📸 Новая заявка с сайта</h2>
        <table style="border-collapse:collapse;font-family:sans-serif">
          <tr><td style="padding:6px 12px;color:#666">Имя</td><td style="padding:6px 12px"><b>${record.name || "—"}</b></td></tr>
          <tr><td style="padding:6px 12px;color:#666">Телефон</td><td style="padding:6px 12px"><b>${record.phone || "—"}</b></td></tr>
          <tr><td style="padding:6px 12px;color:#666">Email</td><td style="padding:6px 12px">${record.email || "—"}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Тип съёмки</td><td style="padding:6px 12px">${record.shoot_type || "—"}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Тариф</td><td style="padding:6px 12px">${record.plan || "—"}</td></tr>
          <tr><td style="padding:6px 12px;color:#666">Источник</td><td style="padding:6px 12px">${record.source || "—"}</td></tr>
          ${record.message ? `<tr><td style="padding:6px 12px;color:#666">Сообщение</td><td style="padding:6px 12px">${record.message}</td></tr>` : ""}
        </table>
        <p style="color:#999;font-size:12px">${new Date(record.created_at).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })}</p>
      `

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Фото на заказ <noreply@fotostudiozakaz.ru>",
          to: [ALERT_EMAIL],
          subject: `📸 Новая заявка: ${record.name || "?"} — ${record.shoot_type || "?"}`,
          html,
        }),
      });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(err);
    return new Response("error", { status: 500 });
  }
});
