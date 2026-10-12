import Notification from "../models/notification.js";

// Notifications are a side effect of other actions, so a failure here is logged
// and swallowed: it must never make the like, comment or follow itself fail.

// Creates the notifications for one event. Nobody is notified about their own action,
// and a person gets at most one notification per event (the first entry wins).
export const createNotifications = async (items) => {
  try {
    const seen = new Set();
    const docs = [];
    for (const item of items) {
      if (!item.recipient) continue;
      const key = String(item.recipient);
      if (key === String(item.actor) || seen.has(key)) continue;
      seen.add(key);
      docs.push(item);
    }
    if (docs.length > 0) await Notification.insertMany(docs);
  } catch (err) {
    console.log("notification failed:", err);
  }
};

// like / follow: one notification per person per target, however often they toggle
export const upsertNotification = async ({ recipient, actor, type, post = null }) => {
  try {
    if (!recipient || String(recipient) === String(actor)) return;
    await Notification.updateOne(
      { recipient, actor, type, post },
      { $setOnInsert: { read: false } },
      { upsert: true }
    );
  } catch (err) {
    console.log("notification failed:", err);
  }
};

export const removeNotification = async ({ recipient, actor, type, post = null }) => {
  try {
    if (!recipient) return;
    await Notification.deleteOne({ recipient, actor, type, post });
  } catch (err) {
    console.log("notification failed:", err);
  }
};