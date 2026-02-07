
import axios from 'axios';

const API_URL = 'http://localhost:3000/api';

async function testScheduler() {
    try {
        // 1. Register/Login to get token
        const email = `test-${Date.now()}@example.com`;
        const password = 'password123';

        console.log('Registering user...');
        const registerRes = await axios.post(`${API_URL}/auth/register`, {
            email, password, name: 'Test User'
        });
        const token = registerRes.data.token;
        console.log('Got token:', token);

        // 2. Schedule batch with Delay
        console.log('Scheduling batch with 5s delay...');
        const now = new Date();
        // Schedule for 1 minute in future to avoid immediate execution messing up our checks (optional)
        // But we want to check the `scheduledAt` timestamp in DB, so execution time is fine.
        const startTime = new Date(now.getTime() + 60000).toISOString();

        const res = await axios.post(`${API_URL}/email/batch-schedule`, {
            recipients: ['a@test.com', 'b@test.com', 'c@test.com'],
            subject: 'Test Delay',
            body: 'Body',
            scheduledAt: startTime,
            delaySeconds: 5,
            hourlyLimit: 0
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Schedule Response:', res.data);

        // 3. Verify via Email List API (checking scheduledAt times)
        // We need to wait a bit or just query? 
        // Just query recent emails.
        const listRes = await axios.get(`${API_URL}/email?limit=5`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const emails = listRes.data.emails;
        console.log('Fetched Emails:', emails.length);

        // Reverse order usually? API sorts by createdAt desc.
        // We just need to check difference between timestamps.

        if (emails.length >= 3) {
            const times = emails.map((e: any) => new Date(e.scheduledAt).getTime()).sort();
            console.log('Scheduled Times:', times);

            const diff1 = times[1] - times[0];
            const diff2 = times[2] - times[1];

            console.log(`Diff 1: ${diff1}ms`);
            console.log(`Diff 2: ${diff2}ms`);

            if (diff1 >= 5000 && diff2 >= 5000) {
                console.log('✅ SUCCESS: Delays are respected.');
            } else {
                console.error('❌ FAILURE: Delays are incorrect.');
            }
        }

    } catch (e: any) {
        console.error('Error:', e.response?.data || e.message);
    }
}

testScheduler();
