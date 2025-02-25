import { ApiError, asyncHandler } from "../utils/index.js";
import envStore from "../../config.js";

const addEnv = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const payload = req.body;
    if (!id) throw new ApiError(400, "Please provide env file type");
    for (const key in payload) payload[key] = envStore.encrypt(payload[key]);
    envStore.setDoc(id, payload);
    envStore.sync(id);
    res.status(200).json({ massage: "successfully Updated" });
  } catch (error) {
    console.log(error.message || "ERROR");
    res.json({ success: false, error: error.message });
  }
});

const getEnvTypes = asyncHandler(async (req, res) => {
  res.status(200).json(["development", "production", "staging"]);
});

const getEnv = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const data = await envStore.getDoc(id);
    if (!data) throw Error("NO DATA FOUND");
    Object.entries(data).forEach(
      ([key, value]) => (data[key] = envStore.decrypt(value))
    );
    res.json({ success: true, data });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, error: error.message });
  }
});

const deleteEnv = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { key } = req.query;
    const data = await envStore.removeDocField(id, key);
    console.log(data);

    envStore.sync(id);
    res.json({
      success: true,
      message: "updated env successfully",
    });
  } catch (error) {
    console.log(error.message || "ERROR");
    res.json({ success: false, error: error.message });
  }
});

export { getEnv, addEnv, deleteEnv, getEnvTypes };
