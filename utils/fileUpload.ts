import nextConnect from "next-connect";
import multer from "multer";
import path from "path";

// Store files in public/uploads
const upload = multer({
  storage: multer.diskStorage({
    destination: "./public/uploads",
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
});

export const uploadMiddleware = upload.single("file"); // "file" is the field name

// Usage in API route:
// import { uploadMiddleware } from '../../utils/fileUpload';
// export default nextConnect()
//   .use(uploadMiddleware)
//   .post(async (req, res) => { ... });
