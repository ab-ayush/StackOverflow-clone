import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(), // keep file in memory, not on disk
  limits: { fileSize: 5 * 1024 * 1024, files: 4 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED.includes(file.mimetype)) return cb(new Error("INVALID_IMAGE_TYPE"));
    cb(null, true);
  },
});

const sendToCloudinary = (buffer) =>
  new Promise((resolve, reject) => {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    cloudinary.uploader
      .upload_stream({ folder: "codequest/posts" }, (err, result) =>
        err ? reject(err) : resolve(result)
      )
      .end(buffer);
  });

export const uploadPostImages = (req, res, next) => {
  upload.array("images", 4)(req, res, async (err) => {
    if (!err) {
      try {
        for (const file of req.files || []) {
          const result = await sendToCloudinary(file.buffer);
          file.path = result.secure_url; // full permanent https link
          file.url = result.secure_url;
          file.filename = result.public_id;
          delete file.buffer;
        }
        return next();
      } catch (e) {
        console.error("CLOUDINARY ERROR:", e);
        return res.status(500).json("something went wrong..");
      }
    }

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