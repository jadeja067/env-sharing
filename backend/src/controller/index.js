import {
  ApiError,
  asyncHandler
} from "../utils/index.js";
import crypto from "crypto";
import envStore, { envs } from "../../config.js";

const encrypt = (text) => {
  try {
    const algorithm = process.env.ENCRYPTION_ALGORITHM,
      secretKey = process.env.ENCRYPTION_KEY,
      iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return {
      iv: iv.toString('hex'),
      content: encrypted.toString('hex')
    };
  } catch (error) {
    console.log(error);

  }
};

const addEnv = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body
  if (!id) throw new ApiError(400, "Please provide env file type")
  // Encrypt the value
  for (const key in payload) payload[key] = encrypt(payload[key])
  const docRef = envs.doc(id);
  const data = await docRef.update(payload);
  envStore.updateStatus[id] = !envStore.updateStatus[id]
  envStore.start()
  res.status(200).json(data)
});

const getEnvTypes = asyncHandler(async (req, res) => {
  res.status(200).json(["development", "production", "staging"])
});


export {
  addEnv,
  getEnvTypes
};
