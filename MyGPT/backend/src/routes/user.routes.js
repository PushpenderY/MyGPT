import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getApiKeyStatus,
  saveApiKey,
  deleteApiKey,
  setLastUsedProvider,
} from "../controllers/user.controller.js";

const router = Router();

router.use(verifyJWT);

router.route("/api-keys").get(getApiKeyStatus).put(saveApiKey);
router.delete("/api-keys/:provider", deleteApiKey);
router.patch("/last-provider", setLastUsedProvider);

export default router;
