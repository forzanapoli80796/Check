import nodemailer from "nodemailer";

function createTransporter() {
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const host = process.env.SMTP_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.SMTP_PORT || "587");

  if (!user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export async function sendKugelnWarningEmail(params: {
  store: string;
  quantity: number;
  employeeName: string;
}) {
  const { store, quantity, employeeName } = params;
  const transporter = createTransporter();

  const today = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const body = `Achtung!

${store} hat heute, am ${today}, bereits ${quantity} Kugeln für morgen verwendet. Bitte leite eine Nachproduktion ein und veranlasse die Nachlieferung.

Erfasst von: ${employeeName}

Dein Forza Check`;

  if (!transporter) {
    console.warn(
      "[E-Mail] SMTP nicht konfiguriert (SMTP_USER / SMTP_PASS fehlen). E-Mail würde gesendet werden:\n" +
        body
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Forza Check" <${process.env.SMTP_USER}>`,
      to: "bestellung@forzanapoli.de",
      subject: `⚠️ Kugeln von morgen verwendet – ${store}`,
      text: body,
    });
    console.log(`[E-Mail] Warn-E-Mail erfolgreich gesendet für Store ${store}`);
  } catch (err) {
    console.error("[E-Mail] Fehler beim Senden der Warn-E-Mail:", err);
  }
}
