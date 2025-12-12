
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    console.log('Starting debug registration...');
    console.log('JWT_SECRET present:', !!process.env.JWT_SECRET);

    // Test JWT Sign content
    try {
        console.log('Testing JWT signing...');
        const token = jwt.sign({ id: 'test-id' }, process.env.JWT_SECRET!, {
            expiresIn: '90d',
        });
        console.log('JWT Sign Success');
    } catch (e) {
        console.error('JWT Sign FAILED:', e);
        return;
    }


    const email = `test_debug_${Date.now()}@example.com`;
    const password = 'Password@123';

    // Simulate frontend payload processing
    const payload = {
        name: "Debug User",
        email: email,
        password: password,
        phone: "9876543210",
        countryCode: "+91",
        dob: "1990-01-01",
        height: "175",
        weight: "70",
        country: "India",
        state: "Maharashtra",
        city: "Mumbai",
        dojoId: "fallback", // This triggers the logic
        currentBeltRank: "White",
        role: "STUDENT" as const,
        fatherName: "Debug Father",
        fatherPhone: "9876543211"
    };

    try {
        const hashedPassword = await bcrypt.hash(payload.password, 12);

        console.log('Attempting transaction...');

        const userId = await prisma.$transaction(async (tx) => {
            console.log('Inside transaction');
            const isStudent = payload.role === 'STUDENT';
            const isInstructor = (payload.role as string) === 'INSTRUCTOR'; // false
            const requestedBelt = payload.currentBeltRank || 'White';
            const isClaimingHigherBelt = isStudent && requestedBelt !== 'White'; // false

            // Validate dojoId if provided (skip validation for empty, null, or 'fallback')
            // Frontend logic: if fallback, it deletes dojoId from payload. 
            // BUT strict backend controller logic might expect it or handle it.
            // Let's mimic controller logic exactly:

            const dojoId = payload.dojoId;
            const instructorId = undefined; // Frontend deletes it if fallback

            if (dojoId && dojoId !== 'fallback' && dojoId.trim() !== '') {
                console.log('Checking dojo...');
                const dojoExists = await tx.dojo.findUnique({
                    where: { id: dojoId }
                });
                if (!dojoExists) {
                    throw new Error('Invalid dojo selected');
                }
            }

            // Determine verification status and initial belt
            let verificationStatus = 'VERIFIED'; // 'VERIFIED' | 'PENDING_VERIFICATION' in controller
            let initialBelt = 'White';

            if (isStudent) {
                if (requestedBelt === 'White') {
                    // White belt students are auto-verified
                    initialBelt = 'White';
                    verificationStatus = 'VERIFIED';
                }
                // ... other logic
            }

            console.log('Creating user...');
            const user = await tx.user.create({
                data: {
                    email: payload.email,
                    passwordHash: hashedPassword,
                    name: payload.name,
                    phone: payload.phone,
                    countryCode: payload.countryCode || '+91',
                    dateOfBirth: payload.dob ? new Date(payload.dob) : undefined,
                    height: payload.height ? parseFloat(payload.height) : undefined,
                    weight: payload.weight ? parseFloat(payload.weight) : undefined,
                    city: payload.city,
                    state: payload.state,
                    country: payload.country || 'India',
                    dojoId: (dojoId && dojoId !== 'fallback' && dojoId.trim() !== '') ? dojoId : undefined,
                    // primaryInstructorId: undefined,
                    role: 'STUDENT', // Enum?
                    membershipStatus: 'PENDING',
                    currentBeltRank: initialBelt,
                    verificationStatus: verificationStatus as any, // Cast to enum
                    fatherName: payload.fatherName,
                    fatherPhone: payload.fatherPhone,
                },
            });
            console.log('User created:', user.id);

            // Create initial belt history
            await tx.beltHistory.create({
                data: {
                    studentId: user.id,
                    oldBelt: null,
                    newBelt: initialBelt,
                    promotedBy: user.id, // <--- This might be the issue if promotedBy refers to a User that must exist (it does, user.id), but maybe self-ref is weird in same transaction? 
                    // Wait, promotedBy is a required field. If user.id is valid, it should work.
                    notes: 'Initial registration - White Belt',
                    promotionDate: new Date(),
                },
            });
            console.log('Belt history created');

            return user.id;
        });

        console.log('Success! User ID:', userId);

    } catch (error) {
        console.error('CRASH REPRODUCED:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
