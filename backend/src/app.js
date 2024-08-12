import express from "express";
import cors from "cors";
import testRouter from "./routes/index.js";
import {config} from 'dotenv'
// App
const app = express();

// Load environment variables
config()

// Middlewares
app.use(
  cors()
);
app.use(
  express.json({
    limit: "3mb",
  })
);
app.use(
  express.urlencoded({
    limit: "3mb",
    extended: true,
  })
);
app.use(express.static("public"));

// Rotues
app.use("/", testRouter);

// exporting App
export default app;
