import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const UPLOAD_DIR = path.join(__dirname, "..", "uploads", "posts");
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  // random name + extension chosen by us, never the user's original filename
  filename: (req, file, cb) =>
    cb(null, `${crypto.randomUUID()}${EXT_BY_MIME[file.mimetype]}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => {
    if (!EXT_BY_MIME[file.mimetype]) return cb(new Error("INVALID_IMAGE_TYPE"));
    cb(null, true);
  },
});

export const uploadPostImages = (req, res, next) => {
  upload.array("images", 4)(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ message: "Each image must be 5MB or smaller" });
      }
      if (err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE") {
        return res.status(400).json({ message: "You can attach up to 4 images" });
      }
      return res.status(400).json({ message: err.message });
    }
    if (err.message === "INVALID_IMAGE_TYPE") {
      return res.status(400).json({ message: "Only JPG, PNG, WebP and GIF images are allowed" });
    }
    console.log(err);
    res.status(500).json("something went wrong..");
  });
};