import express from "express";
import { authController } from "../controllers/auth.controller";

const router = express.Router();

router.post("/email", authController.emailLogin);

export const authRoutes = router;
