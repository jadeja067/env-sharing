import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import redis from 'redis'
import { fileURLToPath } from 'url';
import path from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


config({ path: './.env.keys' });

class Firestore {
    db;
    collection;
    constructor(envType) {
        admin.initializeApp({
            credential: admin.credential.cert({
                "type": process.env.TYPE,
                "project_id": process.env.PROJECT_ID,
                "private_key_id": process.env.PRIVATE_KEY_ID,
                "private_key": process.env.PRIVATE_KEY,
                "client_email": process.env.CLIENT_EMAIL,
                "client_id": process.env.CLIENT_ID,
                "auth_uri": process.env.AUTH_URI,
                "token_uri": process.env.TOKEN_URI,
                "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
                "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
                "universe_domain": process.env.UNIVERSE_DOMAIN
            }),
            projectId: process.env.PROJECT_ID
        });
        this.db = getFirestore();
        
        this.setCollection()
        console.log(this.setCollection);
    }
    setCollection(name = 'envs') {
        this.collection = this.db.collection(name);
    }
    async getDoc(type) {
        const docs = await this.collection.doc(type).get();
        return docs.data();
    }
    async setDoc(type, payload) {
        const docRef = this.collection.doc(type);
        const data = await docRef.update(payload);
        return data;
    }
}

class Redis extends Firestore {
    client;
    constructor(args = {
        port: 6379,
        host: '127.0.0.1',
    }) {
        super()
        this.client = redis.createClient(args)
    }
    async connect() {
        await this.client.connect();
        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });
    }
    async set(key, data) {
        if (!key || !data) throw new Error("Insufficient data")
        try {
            await this.connect()
            const res = await this.client.set(key, JSON.stringify(data));
            if (res) console.log('Redis data is updated successfully');
            return res;
        } finally {
            await this.client.quit();
        }
    };
    async get(key) {
        if (!key) throw new Error("Please provide a key");
        try {
            await this.connect()
            const res = await this.client.get(key);
            if (res) console.log('Redis data is retrived successfully');
            return JSON.parse(res);
        } finally {
            await this.client.quit();
        }
    };
}

class envsHandler extends Redis {
    algorithm;
    secretKey;
    envFile;
    type;

    constructor() {
        super()
        this.algorithm = process.env.ENCRYPTION_ALGORITHM
        this.secretKey = process.env.ENCRYPTION_KEY
        this.envFile = process.env.ENVIRONMENT_FILE_PATH
        this.type = process.env.NODE_ENV
    }

    async write(envVars, filePath = this.envFile) {
        let envContent = Object.entries(envVars).map(([key, value]) => `${key}=${this.decrypt(value)}`).join('\n');
        console.log(`writing from ${this.type} to .env`);
        fs.writeFileSync(path.join(__dirname, filePath), envContent);
    };

    async read(filePath = this.envVars) {
        if (fs.existsSync(filePath)) {
            const envContent = fs.readFileSync(filePath, 'utf8').split(/\n/)
            return envContent
        }
        return;
    }

    decrypt(hash) {
        try {
            const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secretKey), Buffer.from(hash.iv, 'hex'));
            const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            console.log(error);
        }
    };

    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey), iv);
            const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
            return {
                iv: iv.toString('hex'),
                content: encrypted.toString('hex')
            };
        } catch (error) {
            console.log(error);
        }
    };

    async getEnvType(filePath = this.envFile) {
        const data = await this.read(filePath)
        data.forEach((s, i) => {
            s = s.trim().replaceAll("'", "")
            if (s == 'NODE_ENV=production' || s == 'NODE_ENV=development' || s == 'NODE_ENV=staging') {
                this.type = s.split('=')[1]
                return
            } else this.type = 'development'
        })
        return this.type
    }

    async start() {
        try {
            let vars = await this.get(this.type)
            if (!vars) {
                await this.sync(this.type)
            } else this.write(vars);
        } catch (error) {
            console.log(error);
        }
    }
    async sync(type) {        
        try {
            const vars = await this.getDoc(type)
            await this.set(this.type, vars)
            if (this.type == type) {
                this.write(vars);
            }
        } catch (error) {
            console.log(error);
        }
    }
}

const envStore = new envsHandler()

export default envStore



/**
 * import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import redis from 'redis'

config({ path: './.env.keys' });
class Firestore {
    db;
    collection;
    constructor(envType) {
        admin.initializeApp({
            credential: admin.credential.cert({
                "type": process.env.TYPE,
                "project_id": process.env.PROJECT_ID,
                "private_key_id": process.env.PRIVATE_KEY_ID,
                "private_key": process.env.PRIVATE_KEY,
                "client_email": process.env.CLIENT_EMAIL,
                "client_id": process.env.CLIENT_ID,
                "auth_uri": process.env.AUTH_URI,
                "token_uri": process.env.TOKEN_URI,
                "auth_provider_x509_cert_url": process.env.AUTH_PROVIDER_X509_CERT_URL,
                "client_x509_cert_url": process.env.CLIENT_X509_CERT_URL,
                "universe_domain": process.env.UNIVERSE_DOMAIN
            }),
            projectId: process.env.PROJECT_ID
        });
        this.db = getFirestore();
        this.setCollection()
    }
    setCollection(name = 'envs') {
        this.collection = this.db.collection(name);
    }
    async getDoc(type) {
        console.log(type)
        const docs = await this.collection.doc(type).get();
        return docs.data();
    }
    async setDoc(type, payload) {
        const docRef = this.collection.doc(type);
        const data = await docRef.update(payload);
        return data;
    }
}

class Redis extends Firestore {
    client;
    constructor(args = {
        port: 6379,
        host: '127.0.0.1',
    }) {
        super()
        this.client = redis.createClient(args)
    }
    async connect() {
        await this.client.connect();
        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });
    }
    async set(key, data) {
        if (!key || !data) throw new Error("Insufficient data")
        try {
            await this.connect()
            const res = await this.client.set(key, JSON.stringify(data));
            if (res) console.log('Redis data is updated successfully');
            return res;
        } finally {
            await this.client.quit();
        }
    };
    async get(key) {
        if (!key) throw new Error("Please provide a key");
        try {
            await this.connect()
            const res = await this.client.get(key);
            if (res) console.log('Redis data is retrived successfully');
            return JSON.parse(res);
        } finally {
            await this.client.quit();
        }
    };
}

class envsHandler extends Redis {
    algorithm;
    secretKey;
    envFile;
    type;
    updateStatus;

    constructor() {
        super()
        this.algorithm = process.env.ENCRYPTION_ALGORITHM
        this.secretKey = process.env.ENCRYPTION_KEY
        this.envFile = process.env.ENVIRONMENT_FILE_PATH
        this.type =process.env.NODE_ENV
    }

    async write(envVars, filePath = this.envFile) {
        console.log(envVars, filePath);
        
        let envContent = Object?.entries(envVars).map(([key, value]) => `${key}=${this.decrypt(value)}`).join('\n');
        console.log(`writing from ${this.type} to .env`);
        
        fs.writeFileSync(filePath, envContent);
    };

    async read(filePath = this.envVars) {
        if (fs.existsSync(filePath)) {
            const envContent = fs.readFileSync(filePath, 'utf8').split(/\n/)
            return envContent
        }
        return;
    }

    decrypt(hash) {
        try {
            const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secretKey), Buffer.from(hash.iv, 'hex'));
            const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            console.log(error);
        }
    };

    encrypt(text) {
        try {
            const iv = crypto.randomBytes(16);
            const cipher = crypto.createCipheriv(this.algorithm, Buffer.from(this.secretKey), iv);
            const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
            return {
                iv: iv.toString('hex'),
                content: encrypted.toString('hex')
            };
        } catch (error) {
            console.log(error);
        }
    };

    async getEnvType(filePath = this.envFile) {
        const data = await this.read(filePath)
        data.forEach((s, i) => {
            s = s.trim().replaceAll("'", "")
            if (s == 'NODE_ENV=production' || s == 'NODE_ENV=development' || s == 'NODE_ENV=staging') {
                this.type = s.split('=')[1]
                return
            } else this.type = 'development'
        })
        return this.type
    }

    async start() {
        try {
            // await this.getEnvType()
            let vars
            // let vars = await this.get(this.type)
            // if (!vars) {
                await this.sync(this.type)
            // } else 
            // this.write(vars);
        } catch (error) {
            console.log(error);
        }
    }
    async sync(type) {        
        try {
            // await this.getEnvType()
            const vars = await this.getDoc(type)
            console.log(172, vars);
            
            // await this.set(this.type, vars)
            if (this.type == type) {
                this.write(vars);
            }
        } catch (error) {
            console.log(error);
        }
    }
}

const envStore = new envsHandler()

export default envStore
 */