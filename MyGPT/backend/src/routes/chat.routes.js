import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createChat,
  getUserChats,
  getChatById,
  updateChat,
  deleteChat,
} from "../controllers/chat.controller.js";
import { getChatMessages } from "../controllers/message.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/").post(createChat).get(getUserChats);
router
  .route("/:chatId")
  .get(getChatById)
  .patch(updateChat)
  .delete(deleteChat);
router.get("/:chatId/messages", getChatMessages);

export default router;
