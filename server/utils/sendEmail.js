import { sendMail } from "./sendMail.js";

export const sendEmail = async (to, subject, text) => {
  await sendMail({ to, subject, text });
};