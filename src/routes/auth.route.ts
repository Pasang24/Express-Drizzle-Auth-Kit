import express from "express";
import { authController } from "../controllers/auth.controller";

const router = express.Router();

router.post("/email", authController.emailLogin);
router.get("/google", authController.googleLogin);
router.get("/google/callback", authController.googleLoginCallback);

export const authRoutes = router;
