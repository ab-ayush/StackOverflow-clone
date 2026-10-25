const MESSAGES = {
  en: {
    subject: "Your Code-Quest verification code",
    body: (code, minutes) =>
      `Your verification code is ${code}. It expires in ${minutes} minutes. Never share this code with anyone.`,
  },
  es: {
    subject: "Tu código de verificación de Code-Quest",
    body: (code, minutes) =>
      `Tu código de verificación es ${code}. Caduca en ${minutes} minutos. No compartas este código con nadie.`,
  },
  hi: {
    subject: "आपका Code-Quest सत्यापन कोड",
    body: (code, minutes) =>
      `आपका सत्यापन कोड ${code} है। यह ${minutes} मिनट में समाप्त हो जाएगा। यह कोड किसी के साथ साझा न करें।`,
  },
  pt: {
    subject: "Seu código de verificação do Code-Quest",
    body: (code, minutes) =>
      `Seu código de verificação é ${code}. Ele expira em ${minutes} minutos. Não compartilhe este código com ninguém.`,
  },
  zh: {
    subject: "您的 Code-Quest 验证码",
    body: (code, minutes) =>
      `您的验证码是 ${code}，${minutes} 分钟内有效。请勿将验证码告诉任何人。`,
  },
  fr: {
    subject: "Votre code de vérification Code-Quest",
    body: (code, minutes) =>
      `Votre code de vérification est ${code}. Il expire dans ${minutes} minutes. Ne communiquez ce code à personne.`,
  },
};

export const otpMessage = (language, code, minutes) => {
  const message = MESSAGES[language] || MESSAGES.en;
  return { subject: message.subject, body: message.body(code, minutes) };
};