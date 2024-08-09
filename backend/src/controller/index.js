import {
  ApiError,
  asyncHandler
} from "../utils/index.js";
import envs from '../../config.js'
import crypto from "crypto";


const encrypt = (text) => {
  try {
    
    const algorithm = process.env.ENCRYPTION_ALGORITHM,
    secretKey = process.env.ENCRYPTION_KEY,
    iv = crypto.randomBytes(16);
    
    console.log(algorithm, secretKey, iv, text);
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
    console.log(payload);
  payload.value = encrypt(payload.value)
  const docRef = envs.doc(id);
  const data = await docRef.update(payload);
  res.status(200).json(data)
});

const getEnvTypes = asyncHandler(async (req, res) => {
  res.status(200).json(["development", "production", "staging"])
});


export {
  addEnv,
  getEnvTypes
};
