import 'dotenv/config';
import http, { IncomingMessage } from 'http';
import { PrismaClient } from '@prisma/client';

// Instantiate Prisma Client explicitly for the test script
const prisma = new PrismaClient();

const API_URL = 'http://localhost:5001/api';
let authToken = '';
let createdDojoId = '';
let createdTournamentId = '';
let createdCampId = '';

const request = (url: string, options: any = {}, body: any = null): Promise<any> => {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const reqOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
        };

        const req = http.request(reqOptions, (res: IncomingMessage) => {
            let data = '';
            res.on('data', (chunk: any) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsedData });
                } catch (e) {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', (e: any) => {
            reject(e);
        });

        if (body) {
            req.write(JSON.stringify(body));
        }
        req.end();
    });
};

const BASE_URL = 'http://localhost:5000';

async function runTest() {
    console.log('Starting E2E Test...');

    try {
        // 1. Health Check
        console.log('\n1. Testing Health Check...');
        const health = await request(`${BASE_URL}/health`);
        console.log('Health Check Status:', health.status);
        if (health.status !== 200) throw new Error('Health check failed');

        // 2. Register User
        console.log('\n2. Testing Registration...');
        const uniqueSuffix = Date.now();
        const email = `testadmin${uniqueSuffix}@example.com`;
        const password = 'password123';

        const register = await request(`${BASE_URL}/api/auth/register`, { method: 'POST' }, {
            name: 'Test Admin',
            email,
            password,
            passwordConfirm: password, // Added passwordConfirm for registration
            phone: '1234567890',
            dojoCode: 'MUM', // Assuming MUM exists or will be ignored if invalid for now
            city: 'Test City',
            role: 'student' // Initially register as student
        });
        console.log('Registration Status:', register.status);
        if (register.status !== 201) throw new Error('Registration failed');
        authToken = register.data.token;
        console.log('User registered with ID:', register.data.data.user.id);

        // 3. Elevate to ADMIN using Prisma directly
        console.log('\n3. Elevating User to ADMIN via Prisma...');
        await prisma.user.update({
            where: { email },
            data: { role: 'ADMIN' }
        });
        console.log('User role updated to ADMIN in database.');

        // 4. Create Dojo (Admin Action)
        console.log('\n4. Testing Create Dojo (Admin)...');
        const dojoData = {
            name: `Kyokushin Test Dojo ${uniqueSuffix}`,
            dojoCode: `TST${uniqueSuffix.toString().slice(-3)}`, // Added dojoCode
            city: 'Test City',
            state: 'TS',
            address: '123 Test St',
            contactEmail: 'dojo@test.com',
            contactPhone: '123-456-7890'
        };
        const createDojo = await request(`${BASE_URL}/api/dojos`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` }
        }, dojoData);
        console.log('Create Dojo Status:', createDojo.status);
        if (createDojo.status !== 201) {
            console.error('Create Dojo Error:', createDojo.data);
            throw new Error('Create Dojo failed');
        }
        createdDojoId = createDojo.data.data.dojo.id;
        console.log('Dojo Created with ID:', createdDojoId);

        // 5. Create Tournament Event (Admin Action)
        console.log('\n5. Testing Create Tournament (Admin)...');
        const tournamentData = {
            name: `Test Tournament ${uniqueSuffix}`,
            type: 'TOURNAMENT',
            startDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            endDate: new Date(Date.now() + 172800000).toISOString(), // Day after tomorrow
            location: 'Test Arena',
            description: 'A test tournament',
            dojoId: createdDojoId,
            registrationDeadline: new Date(Date.now() + 43200000).toISOString(),
            memberFee: 500,
            nonMemberFee: 1000,
            categories: [{ age: '18-35', weight: '-70kg', belt: 'Black' }]
        };
        const createTournament = await request(`${BASE_URL}/api/events`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` }
        }, tournamentData);
        console.log('Create Tournament Status:', createTournament.status);
        if (createTournament.status !== 201) {
            console.error('Create Tournament Error:', createTournament.data);
            throw new Error('Create Tournament failed');
        }
        createdTournamentId = createTournament.data.data.event.id;
        console.log('Tournament Created with ID:', createdTournamentId);

        // 6. Create Camp Event (Admin Action)
        console.log('\n6. Testing Create Camp (Admin)...');
        const campData = {
            name: `Test Camp ${uniqueSuffix}`,
            type: 'CAMP',
            startDate: new Date(Date.now() + 604800000).toISOString(), // Next week
            endDate: new Date(Date.now() + 691200000).toISOString(),
            location: 'Test Campgrounds',
            description: 'A test camp',
            dojoId: createdDojoId,
            registrationDeadline: new Date(Date.now() + 518400000).toISOString(),
            memberFee: 2000,
            nonMemberFee: 3000
        };
        const createCamp = await request(`${BASE_URL}/api/events`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${authToken}` }
        }, campData);
        console.log('Create Camp Status:', createCamp.status);
        if (createCamp.status !== 201) throw new Error('Create Camp failed');
        createdCampId = createCamp.data.data.event.id;
        console.log('Camp Created with ID:', createdCampId);

        // 7. Verify Public Fetch of Dojo
        console.log('\n7. Verifying Public Fetch of Dojo...');
        const getDojo = await request(`${BASE_URL}/api/dojos/${createdDojoId}`);
        console.log('Get Dojo Status:', getDojo.status);
        if (getDojo.status !== 200) throw new Error('Fetch Dojo failed');
        if (getDojo.data.data.dojo.name !== dojoData.name) throw new Error('Dojo name mismatch');
        console.log('Dojo fetched successfully.');

        // 8. Verify Public Fetch of Events
        console.log('\n8. Verifying Public Fetch of Events...');
        const getEvents = await request(`${BASE_URL}/api/events`);
        console.log('Get Events Status:', getEvents.status);
        if (getEvents.status !== 200) throw new Error('Fetch Events failed');
        const events = getEvents.data.data.events;
        const foundTournament = events.find((e: any) => e.id === createdTournamentId);
        const foundCamp = events.find((e: any) => e.id === createdCampId);

        if (!foundTournament) throw new Error('Created Tournament not found in list');
        if (!foundCamp) throw new Error('Created Camp not found in list');
        console.log('Events fetched and verified successfully.');

        console.log('\n✅ E2E TEST PASSED SUCCESSFULLY');

    } catch (error) {
        console.error('\n❌ E2E TEST FAILED');
        console.error(error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

runTest();
