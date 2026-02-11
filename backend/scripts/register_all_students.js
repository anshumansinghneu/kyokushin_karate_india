/**
 * Register all ACTIVE students for KKFI National Championship 2026
 * Run: cd backend && npx tsx scripts/register_all_students.ts
 */
require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function getAge(dob) {
  if (!dob) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
  return age;
}

function getAgeCategory(age) {
  if (age < 12) return 'Under 12';
  if (age < 16) return '12-15';
  if (age < 18) return '16-17';
  if (age <= 35) return '18-35';
  return '36+';
}

function getWeightCategory(weight, age) {
  if (age < 16) {
    if (weight < 35) return 'Under 35kg';
    if (weight < 45) return '35-45kg';
    if (weight < 55) return '45-55kg';
    return '55kg+';
  }
  // 16-17 and adults
  if (weight < 60) return 'Under 60kg';
  if (weight < 70) return '60-70kg';
  if (weight < 80) return '70-80kg';
  return '80kg+';
}

// For veterans (36+), different weight brackets
function getVeteranWeightCategory(weight) {
  if (weight < 70) return 'Under 70kg';
  return '70kg+';
}

async function main() {
  console.log('🏆 Registering all active students for KKFI National Championship 2026...\n');

  // Find the tournament
  const tournament = await prisma.event.findFirst({
    where: { name: 'KKFI National Championship 2026' },
  });

  if (!tournament) {
    console.error('❌ Tournament not found!');
    process.exit(1);
  }

  console.log(`📋 Tournament: ${tournament.name} (ID: ${tournament.id})`);
  console.log(`   Date: ${tournament.startDate.toLocaleDateString()} – ${tournament.endDate.toLocaleDateString()}`);
  console.log(`   Location: ${tournament.location}\n`);

  // Get all active students with weight and DOB
  const students = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      membershipStatus: 'ACTIVE',
    },
    select: {
      id: true,
      name: true,
      dateOfBirth: true,
      weight: true,
      currentBeltRank: true,
    },
  });

  console.log(`👥 Found ${students.length} active students\n`);

  // Check existing registrations
  const existing = await prisma.eventRegistration.findMany({
    where: { eventId: tournament.id },
    select: { userId: true },
  });
  const alreadyRegistered = new Set(existing.map(r => r.userId));

  const registrations = [];
  const skipped = [];
  const categoryStats = {};

  for (const student of students) {
    if (alreadyRegistered.has(student.id)) {
      skipped.push(student.name);
      continue;
    }

    const age = getAge(student.dateOfBirth);
    const weight = student.weight;

    if (!age || !weight) {
      skipped.push(`${student.name} (missing age/weight)`);
      continue;
    }

    const ageCat = getAgeCategory(age);
    let weightCat;
    if (ageCat === '36+') {
      weightCat = getVeteranWeightCategory(weight);
    } else {
      weightCat = getWeightCategory(weight, age);
    }

    const catKey = `${ageCat} / ${weightCat}`;
    categoryStats[catKey] = (categoryStats[catKey] || 0) + 1;

    registrations.push({
      eventId: tournament.id,
      userId: student.id,
      categoryAge: ageCat,
      categoryWeight: weightCat,
      categoryBelt: 'Open',
      eventType: 'Kumite',
      paymentStatus: 'PAID',
      paymentAmount: tournament.memberFee,
      finalAmount: tournament.memberFee,
      approvalStatus: 'APPROVED',
      approvedAt: new Date(),
    });
  }

  if (registrations.length === 0) {
    console.log('⚠️  No new registrations to create.');
    await prisma.$disconnect();
    process.exit(0);
  }

  // Batch insert
  const result = await prisma.eventRegistration.createMany({
    data: registrations,
    skipDuplicates: true,
  });

  console.log(`✅ Registered ${result.count} students!\n`);

  if (skipped.length > 0) {
    console.log(`⏭️  Skipped ${skipped.length} (already registered or missing data)\n`);
  }

  // Category breakdown
  console.log('═══════════════════════════════════════════════');
  console.log('         REGISTRATION BREAKDOWN');
  console.log('═══════════════════════════════════════════════');

  const sortedCats = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);
  for (const [cat, count] of sortedCats) {
    console.log(`  ${cat.padEnd(30)} ${count} fighters`);
  }
  console.log('═══════════════════════════════════════════════');
  console.log(`  TOTAL                        ${registrations.length} fighters`);
  console.log('═══════════════════════════════════════════════');

  // Final count in DB
  const totalRegs = await prisma.eventRegistration.count({ where: { eventId: tournament.id } });
  const approved = await prisma.eventRegistration.count({ where: { eventId: tournament.id, approvalStatus: 'APPROVED' } });
  console.log(`\n📊 DB total registrations: ${totalRegs} (${approved} approved)`);

  await prisma.$disconnect();
  process.exit(0);
}

main().catch(e => { console.error('❌', e); process.exit(1); });
