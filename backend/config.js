import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { config } from 'dotenv';
import crypto from 'crypto';
import fs from 'fs';
import { setVars, getVars } from './redis.js'

config({ path: './.env.keys' });

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

const db = getFirestore();
const envs = db.collection('envs');

class envsHandler {
    constructor() {
        this.algorithm = process.env.ENCRYPTION_ALGORITHM
        this.secretKey = process.env.ENCRYPTION_KEY
        this.envFile = process.env.ENVIRONMENT_FILE_PATH
        this.type = undefined
        this.updateStatus = {
            development: true,
            production: true,
            staging: true
        }
    }
    async writeEnvVariables(envVars, filePath = this.envFile) {
        let envContent = Object.entries(envVars).map(([key, value]) => `${key}=${this.decrypt(value)}`).join('\n');
        envContent = envContent.concat(`\nNODE_ENV=${this.type}`)
        fs.writeFileSync(filePath, envContent);
    };
    async readEnvVariables(filePath = this.envVars) {
        if (fs.existsSync(filePath)) {
            const envContent = fs.readFileSync(filePath, 'utf8').split(/\n/)
            return envContent
        }
        return;
    }

    decrypt(hash) {
        const decipher = crypto.createDecipheriv(this.algorithm, Buffer.from(this.secretKey), Buffer.from(hash.iv, 'hex'));
        const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
        return decrypted.toString();
    };

    async getEnvType(filePath = this.envFile) {
        const data = await this.readEnvVariables(filePath)
        data.forEach((s, i) => {
            s = s.trim().replaceAll("'", "")
            if (s == 'NODE_ENV=production' || s == 'NODE_ENV=development' || s == 'NODE_ENV=staging') {
                this.type = s.split('=')[1]
                return
            }else this.type='development'
        })
        return this.type
    }

    async start() {
        try {
            await this.getEnvType()
            let vars = await getVars(this.type)

            if (!vars || !this.updateStatus[this.type]) {
                const docs = await envs.doc(this.type).get();
                vars = docs.data();
                await setVars(this.type, vars)
                this.updateStatus[this.type] = true
            }
            this.writeEnvVariables(vars);
        } catch (error) {
            console.log(91, error);
        }
    }
}

const envStore = new envsHandler()

export { envs }
export default envStore