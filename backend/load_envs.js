import crypto from 'crypto';
import envs from './config.js';
import fs from 'fs';

const algorithm = process.env.ENCRYPTION_ALGORITHM,
    secretKey = process.env.ENCRYPTION_KEY,
    envFile = process.env.ENVIRONMENT_FILE_PATH;


const decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);
    return decrypted.toString();
};

const writeEnvVariables = (filePath, envVars) => {
    const envContent = Object.entries(envVars).map(([key, value]) => `env.process.${key}=${decrypt(value)}`).join('\n');
    fs.writeFileSync(filePath, envContent);
};

const main = async (type) => {
    try {
        const docs  = await envs.doc(type).get();
        const vars = docs.data();        
        writeEnvVariables(envFile, vars);
    } catch (error) {
        console.error(error);
    }
}

main('development');