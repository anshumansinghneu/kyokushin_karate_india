import dotenv from 'dotenv';
dotenv.config();
import prisma from '../src/prisma';

async function assignMembershipNumbers() {
    const users = await prisma.user.findMany({
        orderBy: [{ createdAt: 'asc' }],
        select: { id: true, name: true, role: true, membershipNumber: true }
    });

    const admins = users.filter(u => u.role === 'ADMIN');
    const instructors = users.filter(u => u.role === 'INSTRUCTOR');
    const students = users.filter(u => u.role === 'STUDENT');

    console.log(`Found ${admins.length} admins, ${instructors.length} instructors, ${students.length} students\n`);

    // Admins: KKFI-ADM-0001
    for (let i = 0; i < admins.length; i++) {
        const num = 'KKFI-ADM-' + String(i + 1).padStart(4, '0');
        await prisma.user.update({ where: { id: admins[i].id }, data: { membershipNumber: num } });
        console.log(`  ${admins[i].name} -> ${num}`);
    }

    // Instructors: KKFI-INS-0001
    for (let i = 0; i < instructors.length; i++) {
        const num = 'KKFI-INS-' + String(i + 1).padStart(4, '0');
        await prisma.user.update({ where: { id: instructors[i].id }, data: { membershipNumber: num } });
        console.log(`  ${instructors[i].name} -> ${num}`);
    }

    // Students: KKFI-STD-00001
    for (let i = 0; i < students.length; i++) {
        const num = 'KKFI-STD-' + String(i + 1).padStart(5, '0');
        await prisma.user.update({ where: { id: students[i].id }, data: { membershipNumber: num } });
        console.log(`  ${students[i].name} -> ${num}`);
    }

    console.log('\n✅ All membership numbers assigned!');
    await prisma.$disconnect();
}

assignMembershipNumbers().catch(console.error);
