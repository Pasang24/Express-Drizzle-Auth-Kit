import "dotenv/config";
import express from "express";
import cors, { CorsOptions } from "cors";
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/auth.route";

const app = express();

const corsOptions: CorsOptions = {
  origin: process.env.FRONTEND_URL,
  methods: ["GET", "POST", "UPDATE", "DELETE", "PUT", "PATCH", "OPTIONS"],
  credentials: true,
};

//middlewares
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

export default app;
