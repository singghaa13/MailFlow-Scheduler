
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const email = 'bishusingh60@gmail.com';
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (user) {
            console.log(`User found: ${user.email} (ID: ${user.id})`);
        } else {
            console.log(`User not found: ${email}`);
        }
    } catch (error) {
        console.error('Error checking user:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
