import { Router } from "express";
import { getEnv, addEnv, getEnvTypes, deleteEnv } from "../controller/index.js";

const testRouter = Router();
testRouter.get("/", getEnvTypes);
testRouter.get("/:id", getEnv);
testRouter.post("/:id", addEnv);
testRouter.delete("/:id", deleteEnv);


export default testRouter;
