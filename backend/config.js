import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import { config } from "dotenv";
import crypto from "crypto";
import fs from "fs";
// import redis from "redis";
import { fileURLToPath } from "url";
import path from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

config({ path: "./.env.keys" });

class Firestore {
  db;
  collection;
  constructor(envType) {
    admin.initializeApp({
      credential: admin.credential.cert({
        type: process.env.TYPE,
        project_id: process.env.PROJECT_ID,
        private_key_id: process.env.PRIVATE_KEY_ID,
        private_key: process.env.PRIVATE_KEY,
        client_email: process.env.CLIENT_EMAIL,
        client_id: process.env.CLIENT_ID,
        auth_uri: process.env.AUTH_URI,
        token_uri: process.env.TOKEN_URI,
        auth_provider_x509_cert_url: process.env.AUTH_PROVIDER_X509_CERT_URL,
        client_x509_cert_url: process.env.CLIENT_X509_CERT_URL,
        universe_domain: process.env.UNIVERSE_DOMAIN,
      }),
    });
    this.db = getFirestore();
    this.setCollection();
  }
  setCollection(name = "envs") {
    this.collection = this.db.collection(name);
  }
  async getDoc(type) {
    const docs = await this.collection?.doc(type)?.get();
    return docs?.data();
  }
  async setDoc(type, payload) {
    const docRef = this.collection?.doc(type);
    const data = await docRef?.set(payload, { merge: true });
    return data;
  }
  async removeDocField(type, field) {
    const docRef = this.collection.doc(type);
    const deleteDoc = await docRef.update({
      [field]: admin.firestore.FieldValue.delete(),
    });
    return deleteDoc;
  }
}

// class Redis extends Firestore {
//   client;
//   constructor(
//     args = {
//       port: 6379,
//       host: "127.0.0.1",
//     }
//   ) {
//     super();
//     this.client = redis.createClient(args);
//   }
//   async connect() {
//     await this.client.connect();
//     this.client.on("error", () => {
//       console.error("REDIS ERROR: can't connect to server");
//     });
//     return;
//   }
//   async set(key, data) {
//     if (!key || !data) throw new Error("Insufficient data");
//     try {
//       await this.connect();
//       const res = await this.client.set(key, JSON.stringify(data));
//       if (res) console.log("Redis data is updated successfully");
//       return res;
//     } catch (error) {
//       console.log(82, error?.message || "REDIS ERROR");
//     } finally {
//       if (this.client.isOpen) await this.client.quit();
//       return;
//     }
//   }
//   async get(key) {
//     if (!key) throw new Error("Please provide a key");
//     try {
//       await this.connect();
//       const res = await this.client.get(key);
//       if (res) console.log("Redis data is retrived successfully");
//       return JSON.parse(res);
//     } catch (error) {
//       console.log(error?.message || "REDIS ERROR");
//     } finally {
//       if (this.client.isOpen) await this.client.quit();
//       return;
//     }
//   }
// }

class envsHandler extends Firestore {
  algorithm;
  secretKey;
  envFile;
  type;

  constructor() {
    super();
    this.algorithm = process.env.ENCRYPTION_ALGORITHM;
    this.secretKey = process.env.ENCRYPTION_KEY;
    this.envFile = process.env.ENVIRONMENT_FILE_PATH;
    this.type = process.env.NODE_ENV;
  }

  async write(envVars, filePath = this.envFile) {
    let envContent = Object.entries(envVars)
      .map(([key, value]) => `${key}=${this.decrypt(value)}`)
      .join("\n");
    console.log(`writing from ${this.type} to .env`);
    fs.writeFileSync(path.join(__dirname, filePath), envContent);
  }

  async read(filePath = this.envVars) {
    if (fs.existsSync(filePath)) {
      const envContent = fs.readFileSync(path.join(__dirname, filePath), "utf8").split(/\n/);
      return envContent;
    }
    return;
  }

  decrypt(hash) {
    try {
      const decipher = crypto.createDecipheriv(
        this.algorithm,
        Buffer.from(this.secretKey),
        Buffer.from(hash.iv, "hex")
      );
      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(hash.content, "hex")),
        decipher.final(),
      ]);
      return decrypted.toString();
    } catch (error) {
      console.log(error);
    }
  }

  encrypt(text) {
    try {
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipheriv(
        this.algorithm,
        Buffer.from(this.secretKey),
        iv
      );
      const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
      return {
        iv: iv.toString("hex"),
        content: encrypted.toString("hex"),
      };
    } catch (error) {
      console.log(error);
    }
  }

  async start() {
    try {
      /* Redis implementation */
      // let vars = await this.get(this.type);
      // if (!vars) {
      //   await this.sync(this.type);
      // } else this.write(vars);
      /* Redis implementation over */
      await this.sync(this.type);
    } catch (error) {
      console.log(error);
    }
  }
  async sync(type) {
    try {
      const vars = await this.getDoc(type);
      /* Redis implementation */
      // this.set(this.type, vars);
      if (this.type == type) {
        this.write(vars);
      }
    } catch (error) {
      console.log(error);
    }
  }
}

const envStore = new envsHandler();

export default envStore;
