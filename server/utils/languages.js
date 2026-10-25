export const SUPPORTED_LANGUAGES = ["en", "es", "hi", "pt", "zh", "fr"];

// Languages whose switch is verified by an email code. Every other language,
// English included, is verified by a text message to the registered mobile number.
// To exempt English from verification later, that is a change for this file only.
const EMAIL_VERIFIED_LANGUAGES = ["fr"];

export const isSupportedLanguage = (code) => SUPPORTED_LANGUAGES.includes(code);

export const channelFor = (language) =>
  EMAIL_VERIFIED_LANGUAGES.includes(language) ? "email" : "sms";