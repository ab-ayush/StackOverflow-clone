import fs from "fs";

const toBase64 = (a) => {
  if (a.path) return fs.readFileSync(a.path).toString("base64");
  return Buffer.isBuffer(a.content)
    ? a.content.toString("base64")
    : Buffer.from(a.content || "").toString("base64");
};

export const sendMail = async ({ to, subject, text, html, attachments }) => {
  const body = {
    sender: { name: "CodeQuest", email: process.env.EMAIL_USER },
    to: [{ email: to }],
    subject,
    textContent: text,
    ...(html && { htmlContent: html }),
    ...(attachments?.length && {
      attachment: attachments.map((a) => ({
        name: a.filename || "attachment",
        content: toBase64(a),
      })),
    }),
  };

  const res = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(`Brevo error ${res.status}: ${await res.text()}`);
  }
};