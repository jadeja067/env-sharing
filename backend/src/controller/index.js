import {
  ApiError,
  asyncHandler
} from "../utils/index.js";
import envStore from "../../config.js";

const addEnv = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const payload = req.body
  if (!id) throw new ApiError(400, "Please provide env file type")
  for (const key in payload) payload[key] = envStore.encrypt(payload[key])
  envStore.setDoc(id, payload)
  envStore.sync(id)
  res.status(200).json({ massage: "successfully Updated" })
});

const getEnvTypes = asyncHandler(async (req, res) => {
  res.status(200).json(["development", "production", "staging"])
});

const getEnv = asyncHandler(async (req, res) => {
  const { id } = req.params
  const data = await envStore.getDoc(id)
  Object.entries(data).forEach(([key, value]) => data[key] = envStore.decrypt(value));
  res.json({ success: true, data })

})
const deleteEnv = asyncHandler(async (req, res) => { 
  const { id } = req.params
  const { key } = req.query  
  const data = await envStore.removeDocField(id, key)
  envStore.sync(id)
  res.json(data)
})


export {
  getEnv,
  addEnv,
  deleteEnv,
  getEnvTypes
};
