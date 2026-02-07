import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

async function setup() {
    console.log('Generating Ethereal email credentials...');
    
    try {
        const testAccount = await nodemailer.createTestAccount();
        
        console.log('Credentials generated successfully!');
        console.log('User:', testAccount.user);
        console.log('Pass:', testAccount.pass);

        const envPath = path.join(__dirname, '../.env');
        let envContent = fs.readFileSync(envPath, 'utf8');

        // Replace SMTP_USER and SMTP_PASS
        envContent = envContent.replace(/SMTP_USER=.*/, `SMTP_USER="${testAccount.user}"`);
        envContent = envContent.replace(/SMTP_PASS=.*/, `SMTP_PASS="${testAccount.pass}"`);

        fs.writeFileSync(envPath, envContent);
        console.log('Updated .env file with new credentials.');
        
    } catch (error) {
        console.error('Failed to generate credentials:', error);
    }
}

setup();
