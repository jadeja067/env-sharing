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
    const envContent = Object.entries(envVars).map(([key, value]) => `${key}=${value}`).join('\n');
    fs.writeFileSync(filePath, envContent);
};

const main = async () => {
    try {
        const {docs} = await envs.get();
        const vars = docs.map(doc => doc.data());        
        writeEnvVariables(envFile, vars[0]);
    } catch (error) {
        console.error(error);
    }
}

main();