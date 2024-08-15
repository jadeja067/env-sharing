import {
  ApiError,
  asyncHandler
} from "../utils/index.js";
import envStore from "../../config.js";

const addEnv = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body
  if (!id) throw new ApiError(400, "Please provide env file type")
  // Encrypt the value
  for (const key in payload) payload[key] = envStore.encrypt(payload[key])
  envStore.setDoc(id, payload)
  envStore.sync(id)
  res.status(200).json({massage: "successfully Updated"})
});

const getEnvTypes = asyncHandler(async (req, res) => {
  res.status(200).json(["development", "production", "staging"])
});

export {
  addEnv,
  getEnvTypes
};
