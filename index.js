import { config } from 'dotenv';
import crypto from 'crypto';
import envs from './config.js';
import fs, { promises } from 'fs';
import { program } from 'commander';
import inquirer from 'inquirer';

config({ path: './.env' });

const algorithm = 'aes-256-ctr';
const secretKey = process.env.ENCRYPTION_KEY;
const iv = crypto.randomBytes(16);

const registerdEnvs = JSON.parse(fs.readFileSync('./env_manager.json', 'utf8'));
const environment_choices = Object.keys(registerdEnvs)

const encrypt = (text) => {
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    return {
        iv: iv.toString('hex'),
        content: encrypted.toString('hex')
    };
};

const writeEnvVariables = (filePath, envVars) => {
    const envContent = Object.entries(envVars).map(([key, value]) => `${key}=${value}`).join('\n');
    fs.writeFileSync(filePath, envContent);
};

const decrypt = (hash) => {
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), Buffer.from(hash.iv, 'hex'));
    const decrypted = Buffer.concat([decipher.update(Buffer.from(hash.content, 'hex')), decipher.final()]);

    return decrypted.toString();
};

const loadEnvVariables = (filePath) => {
    const envVars = {};
    const envContent = fs.readFileSync(filePath, 'utf8');

    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });
    return envVars;
};

program
    .command('create')
    .description('Create new .env instance')
    .action(async (options) => {

        try {
            let newEnv = undefined;
            while (!newEnv) {
                const { option } = await inquirer.prompt({
                    type: 'input',
                    name: 'option',
                    message: 'Enter name of the new environment [special chars not allowed]:',
                    choices: environment_choices
                });
                if (option) {
                    newEnv = option;
                    break;
                }
            }
            const fileValidation = await promises.access(`./.${newEnv}`, promises.constants.F_OK).catch(async (error) => {
                await promises.writeFile(`./.${newEnv}`, '');
            })

            const envVars = loadEnvVariables(`./.${newEnv}`);
            const encryptedData = {};
            for (const [key, value] of Object.entries(envVars)) {
                encryptedData[key] = encrypt(value);
            }
            const newDocRef = envs.doc();
            await newDocRef.set({
                name: newEnv,
                data: encryptedData
            });
            registerdEnvs[newEnv] = {
                id: newDocRef.id,
                path: `./.${newEnv}`,
            }
            fs.writeFileSync('./env_manager.json', JSON.stringify(registerdEnvs));
            console.log('Data added successfully');
        } catch (error) {
            if (error.message === "User force closed the prompt with 0 null") return
            console.error(error);
        }
    });

program
    .command('push')
    .description('Pushes updated .env to storage')
    .option('-e, --environment <environment>', 'Specify env file')
    .action(async (options) => {
        try {
            if (!options.environment) {
                const { option } = await inquirer.prompt({
                    type: 'list',
                    name: 'option',
                    message: 'Choose from registered env files.',
                    choices: environment_choices
                });
                options.environment = option
            }
            if (!options.environment || !registerdEnvs[options.environment]) return

            const envVars = loadEnvVariables(registerdEnvs[options.environment]?.path);
            const encryptedData = {};

            for (const [key, value] of Object.entries(envVars)) {
                encryptedData[key] = encrypt(value);
            }
            const docRef = envs.doc(registerdEnvs[options.environment]?.id);
            await docRef.update({
                name: options.environment,
                data: encryptedData
            });
            console.log('Data updated and encrypted successfully');
        } catch (error) {
            if (error.message === "User force closed the prompt with 0 null") return
            console.error(error.message);
        }
    });

program
    .command('pull')
    .description('Pulls updated .env from storage')
    .option('-e, --environment <environment>', 'Specify env file')
    .action(async (options) => {
        try {
            if (!options.environment) {
                const { option } = await inquirer.prompt({
                    type: 'list',
                    name: 'option',
                    message: 'Choose from registered env files.',
                    choices: environment_choices
                });
                options.environment = option
            } if (!registerdEnvs[options.environment]) {
                return
            }
            const docRef = envs.doc(registerdEnvs[options.environment]?.id);
            const docSnap = await docRef.get();

            if (docSnap.exists) {
                const encryptedData = docSnap.data();
                const decryptedData = {};

                for (const [key, value] of Object.entries(encryptedData.data)) {
                    decryptedData[key] = decrypt(value);
                }

                writeEnvVariables(registerdEnvs[options.environment]?.path, decryptedData);
                console.log('Data retrieved and written to .env file successfully');
            } else {
                console.log('This env is not saved in storage');
            }
        } catch (error) {
            if (error.message === "User force closed the prompt with 0 null") return
            console.error(error);
        }
    });



program.parse(process.argv);