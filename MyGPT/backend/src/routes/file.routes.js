import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import {
  uploadFile,
  getUserFiles,
  deleteFile,
} from "../controllers/file.controller.js";

const router = Router();

router.use(verifyJWT);

router.post("/upload", upload.array("files", 5), uploadFile);
router.get("/", getUserFiles);
router.delete("/:fileId", deleteFile);

export default router;
