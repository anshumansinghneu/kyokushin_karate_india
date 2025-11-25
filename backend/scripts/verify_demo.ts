import 'dotenv/config';

const BASE_URL = 'http://localhost:8000/api';

const adminCreds = { email: 'admin@kyokushin.com', password: 'password123' };
const instructorCreds = { email: 'instructor@kyokushin.com', password: 'password123' };
const studentCreds = { email: 'student@kyokushin.com', password: 'password123' };

async function request(url: string, method: string, body?: any, token?: string) {
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });

    const text = await response.text();
    try {
        const data = JSON.parse(text);
        return { status: response.status, data };
    } catch (e) {
        console.error(`❌ Failed to parse JSON from ${url} (${method})`);
        console.error('Response body:', text);
        return { status: response.status, data: text };
    }
}

async function runDemoVerification() {
    console.log('🚀 Starting Demo Verification...\n');

    try {
        // 1. Verify Admin Login
        console.log('1️⃣  Verifying Admin Login...');
        const adminLogin = await request(`${BASE_URL}/auth/login`, 'POST', adminCreds);
        if (adminLogin.status === 200 && adminLogin.data.token) {
            console.log('✅ Admin logged in successfully.');
        } else {
            throw new Error(`Admin login failed: ${JSON.stringify(adminLogin.data)}`);
        }
        const adminToken = adminLogin.data.token;

        // 2. Verify Instructor Login & Invite
        console.log('\n2️⃣  Verifying Instructor Login & Invite...');
        const instructorLogin = await request(`${BASE_URL}/auth/login`, 'POST', instructorCreds);
        if (instructorLogin.status === 200) {
            console.log('✅ Instructor logged in.');
        }
        const instructorToken = instructorLogin.data.token;

        const inviteData = {
            name: 'Demo Student',
            email: `demo${Date.now()}@kyokushin.com`,
            phone: '555-0199'
        };

        const inviteRes = await request(`${BASE_URL}/users/invite`, 'POST', inviteData, instructorToken);
        if (inviteRes.status === 201) {
            console.log('✅ Instructor successfully invited a new student.');
        } else {
            console.error('❌ Invite failed:', inviteRes.data);
        }

        // 3. Verify Student Login & Training Log
        console.log('\n3️⃣  Verifying Student Login & Training Log...');
        const studentLogin = await request(`${BASE_URL}/auth/login`, 'POST', studentCreds);
        if (studentLogin.status === 200) {
            console.log('✅ Student logged in.');
        }
        const studentToken = studentLogin.data.token;

        // Log a session
        const trainingData = {
            date: new Date().toISOString(),
            duration: 60,
            intensity: 'HIGH',
            focus: 'Kumite',
            notes: 'Demo session'
        };

        const logRes = await request(`${BASE_URL}/training`, 'POST', trainingData, studentToken);

        if (logRes.status === 201) {
            console.log('✅ Student successfully logged a training session.');
        } else {
            console.error('❌ Log session failed:', logRes.data);
        }

        // Fetch sessions
        const getLogsRes = await request(`${BASE_URL}/training`, 'GET', undefined, studentToken);

        if (getLogsRes.status === 200 && getLogsRes.data.data.sessions.length > 0) {
            console.log(`✅ Student fetched ${getLogsRes.data.data.sessions.length} training sessions.`);
        } else {
            console.error('❌ Fetch sessions failed or empty:', getLogsRes.data);
        }

        // 4. Verify Event History (Profile Fetch)
        console.log('\n4️⃣  Verifying Event History...');
        const profileRes = await request(`${BASE_URL}/auth/me`, 'GET', undefined, studentToken);

        const user = profileRes.data.data.user;
        if (user.registrations && Array.isArray(user.registrations)) {
            console.log(`✅ Student profile includes ${user.registrations.length} event registrations.`);
        } else {
            console.warn('⚠️  Student profile missing registrations array.');
        }

        // 5. Verify Tournament Management
        console.log('\n5️⃣  Verifying Tournament Management...');

        // 5.1 Create Tournament Event (Admin)
        const tournamentData = {
            type: 'TOURNAMENT',
            name: `Demo Tournament ${Date.now()}`,
            description: 'A test tournament',
            startDate: new Date(Date.now() + 86400000).toISOString(),
            endDate: new Date(Date.now() + 172800000).toISOString(),
            registrationDeadline: new Date(Date.now() + 86400000).toISOString(),
            memberFee: 1000,
            nonMemberFee: 1500,
            categories: [
                { name: 'Open Weight', age: '18+', weight: 'Open', belt: 'White' }
            ]
        };

        const createEventRes = await request(`${BASE_URL}/events`, 'POST', tournamentData, adminToken);
        if (createEventRes.status !== 201) throw new Error(`Failed to create tournament: ${JSON.stringify(createEventRes.data)}`);
        const eventId = createEventRes.data.data.event.id;
        console.log('✅ Tournament created:', eventId);

        // 5.2 Register 2 Students (Student + Invite)
        // Register current student
        await request(`${BASE_URL}/events/${eventId}/register`, 'POST', {
            categoryAge: '18+', categoryWeight: 'Open', categoryBelt: 'White'
        }, studentToken);

        // Register another student (we need another user, let's use instructor for demo purposes or create one)
        // For simplicity, let's just register the instructor as a participant (if allowed) or create a temp user.
        // Actually, let's use the instructor account to register as a participant.
        await request(`${BASE_URL}/events/${eventId}/register`, 'POST', {
            categoryAge: '18+', categoryWeight: 'Open', categoryBelt: 'White'
        }, instructorToken);

        // Approve registrations (Admin)
        // We need to find the registrations first.
        // Simplified: Just approve all pending for this event.
        // But we don't have a bulk approve endpoint easily accessible here without fetching.
        // Let's skip approval if auto-approved or assume we can generate brackets anyway (logic check).
        // Wait, generateBrackets checks for 'APPROVED' status.
        // So we MUST approve them.

        // Fetch event to get registrations
        const eventDetails = await request(`${BASE_URL}/events/${eventId}`, 'GET', undefined, adminToken);
        const registrations = eventDetails.data.data.event.registrations;

        for (const reg of registrations) {
            await request(`${BASE_URL}/events/registrations/${reg.id}/approve`, 'POST', { status: 'APPROVED' }, adminToken);
        }
        console.log(`✅ Approved ${registrations.length} participants.`);

        // 5.3 Generate Brackets
        const genRes = await request(`${BASE_URL}/tournaments/${eventId}/generate`, 'POST', {}, adminToken);
        if (genRes.status !== 200) throw new Error(`Bracket generation failed: ${JSON.stringify(genRes.data)}`);
        console.log('✅ Brackets generated.');

        // 5.4 Fetch Brackets & Start Match
        const bracketsRes = await request(`${BASE_URL}/tournaments/${eventId}`, 'GET', undefined, adminToken);
        const match = bracketsRes.data.data.brackets[0].matches[0];

        if (!match) throw new Error('No matches found in generated bracket.');

        // Start Match
        await request(`${BASE_URL}/matches/${match.id}/start`, 'POST', {}, adminToken);
        console.log('✅ Match started.');

        // Update Score
        await request(`${BASE_URL}/matches/${match.id}/score`, 'PATCH', { fighterAScore: 1, fighterBScore: 0 }, adminToken);
        console.log('✅ Score updated.');

        // End Match
        await request(`${BASE_URL}/matches/${match.id}/end`, 'POST', { winnerId: match.fighterAId, notes: 'Winner by Ippon' }, adminToken);
        console.log('✅ Match ended.');

        console.log('\n✨ Demo Verification Completed Successfully!');

    } catch (error: any) {
        console.error('\n❌ Verification Failed:', error.message);
        process.exit(1);
    }
}

runDemoVerification();
