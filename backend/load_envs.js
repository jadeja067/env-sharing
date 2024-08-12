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

const main = async () => {
    try {
        let envType = -1 
        const data = fs.readFileSync(envFile, 'utf8').split('=').map((s, i) => {
            s = s.trim().replaceAll("'", "")            
            if (s == 'process.env.NODE_ENV') envType = i+1
            return s
        })        
        const docs = await envs.doc(data[envType]).get();
        const vars = docs.data();        
        writeEnvVariables(envFile, vars);
    } catch (error) {
        console.error(error);
    }
}

main();