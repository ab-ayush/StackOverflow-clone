import Counter from "../models/counter.js";

export const nextTicketNumber = async () => {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: "ticket" },
        { $inc: { seq: 1 } },
        { new: true, upsert: true }
      );
      return `TKT-${String(counter.seq).padStart(6, "0")}`;
    } catch (error) {
      // two requests created the counter at the same moment: try again
      if (error.code !== 11000 || attempt === 2) throw error;
    }
  }
};