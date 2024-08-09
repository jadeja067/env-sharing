import { Router } from "express";
import { addEnv, getEnvTypes } from "../controller/index.js";

const testRouter = Router();

testRouter.get("/", getEnvTypes);
testRouter.post("/:id", addEnv);

export default testRouter;
