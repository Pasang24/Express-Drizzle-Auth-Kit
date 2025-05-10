import "dotenv/config";
import express from "express";
import cookieParser from "cookie-parser";

const app = express();

//middlewares
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("Hello World");
});

export default app;
