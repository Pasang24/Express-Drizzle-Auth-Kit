import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";
import { authRoutes } from "./routes/auth.route";

const app = express();

//middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Hello World");
});

export default app;
