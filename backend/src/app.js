import express from "express";
import cors from "cors";
import testRouter from "./routes/index.js";

// App
const app = express();

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
