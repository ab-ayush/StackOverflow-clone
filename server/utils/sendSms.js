// SMS_MODE=console  prints the message in the server terminal (development)
// SMS_MODE=twilio   sends a real text through Twilio
export const sendSms = async (to, body) => {
  const mode = (process.env.SMS_MODE || "console").toLowerCase();

  if (mode === "twilio") {
    const {
      TWILIO_ACCOUNT_SID: sid,
      TWILIO_AUTH_TOKEN: token,
      TWILIO_FROM: from,
      TWILIO_MESSAGING_SERVICE_SID: serviceSid,
    } = process.env;
    if (!sid || !token || !(from || serviceSid)) {
      throw new Error("Twilio is selected but its environment variables are missing");
    }

    const params = new URLSearchParams({ To: to, Body: body });
    if (serviceSid) params.set("MessagingServiceSid", serviceSid);
    else params.set("From", from);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Twilio error ${response.status}: ${detail}`);
    }
    return;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("SMS_MODE=console is not allowed in production");
  }
  console.log(`\n[SMS - console mode] To: ${to}\n${body}\n`);
};