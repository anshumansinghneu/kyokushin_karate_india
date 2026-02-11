/**
 * Seed 300 students + 5 extra dojos + 3 extra instructors + 1 upcoming tournament
 * Run: cd backend && npx tsx scripts/seed_300_students.ts
 */
import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ── Indian names ────────────────────────────────────────
const FIRST_NAMES_MALE = [
  'Aarav','Vivaan','Aditya','Vihaan','Arjun','Sai','Reyansh','Ayaan','Krishna','Ishaan',
  'Shaurya','Atharv','Advik','Pranav','Advait','Aarush','Kabir','Rudra','Dhruv','Arnav',
  'Rohan','Rahul','Vikram','Ravi','Suresh','Amit','Gaurav','Deepak','Rajesh','Karan',
  'Nikhil','Mohit','Ankit','Varun','Yash','Mayank','Pradeep','Ashish','Sachin','Tushar',
  'Pankaj','Manish','Naveen','Ajay','Vijay','Tarun','Harsh','Dev','Om','Lakshay',
  'Siddharth','Bharat','Kunal','Rishabh','Parth','Neeraj','Sahil','Chirag','Hitesh','Jatin',
];

const FIRST_NAMES_FEMALE = [
  'Aanya','Diya','Saanvi','Aadhya','Ananya','Isha','Myra','Sara','Kiara','Anika',
  'Avni','Riya','Pooja','Priya','Neha','Shreya','Divya','Kavya','Tanvi','Meera',
  'Nisha','Sanya','Trisha','Jiya','Aarohi','Khushi','Suhani','Ritika','Simran','Aditi',
  'Sneha','Komal','Anjali','Pallavi','Swati','Radhika','Mansi','Nikita','Sakshi','Tanya',
];

const LAST_NAMES = [
  'Singh','Sharma','Verma','Gupta','Kumar','Yadav','Joshi','Patel','Mishra','Tiwari',
  'Chauhan','Rajput','Pandey','Dubey','Srivastava','Agarwal','Saxena','Mehta','Shah','Bose',
  'Das','Roy','Sen','Malhotra','Kapoor','Arora','Bhatia','Nair','Pillai','Reddy',
  'Iyer','Menon','Kulkarni','Deshmukh','Patil','Jadhav','Pawar','Shinde','More','Thakur',
];

// ── Indian cities with states ──────────────────────────
const CITIES = [
  { city: 'Lucknow', state: 'Uttar Pradesh', code: 'LKO' },
  { city: 'Varanasi', state: 'Uttar Pradesh', code: 'VNS' },
  { city: 'Delhi', state: 'Delhi', code: 'DEL' },
  { city: 'Mumbai', state: 'Maharashtra', code: 'MUM' },
  { city: 'Pune', state: 'Maharashtra', code: 'PUN' },
  { city: 'Bangalore', state: 'Karnataka', code: 'BLR' },
  { city: 'Chennai', state: 'Tamil Nadu', code: 'CHE' },
  { city: 'Hyderabad', state: 'Telangana', code: 'HYD' },
  { city: 'Kolkata', state: 'West Bengal', code: 'KOL' },
  { city: 'Jaipur', state: 'Rajasthan', code: 'JAI' },
];

const BELTS = ['White', 'Orange', 'Blue', 'Yellow', 'Green', 'Brown', 'Black'];
const BELT_WEIGHTS = [30, 25, 15, 12, 8, 7, 3]; // Distribution probabilities (more whites)

// ── Helpers ────────────────────────────────────────────
function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function weightedPick(items: string[], weights: number[]): string {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randomDob(minAge: number, maxAge: number): Date {
  const now = new Date();
  const year = now.getFullYear() - randInt(minAge, maxAge);
  const month = randInt(0, 11);
  const day = randInt(1, 28);
  return new Date(year, month, day);
}

function getAge(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now.getMonth() < dob.getMonth() || (now.getMonth() === dob.getMonth() && now.getDate() < dob.getDate())) age--;
  return age;
}

// ── Age categories for tournament ──────────────────────
function getAgeCategory(age: number): string {
  if (age < 12) return 'Under 12';
  if (age < 16) return '12-15';
  if (age < 18) return '16-17';
  if (age <= 35) return '18-35';
  return '36+';
}

function getWeightCategory(weight: number, age: number): string {
  if (age < 16) {
    if (weight < 35) return 'Under 35kg';
    if (weight < 45) return '35-45kg';
    if (weight < 55) return '45-55kg';
    return '55kg+';
  }
  if (weight < 60) return 'Under 60kg';
  if (weight < 70) return '60-70kg';
  if (weight < 80) return '70-80kg';
  return '80kg+';
}

async function main() {
  console.log('🌱 Seeding 300 students...\n');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ── Step 1: Get existing data ────────────────────────
  const existingDojos = await prisma.dojo.findMany();
  const existingInstructors = await prisma.user.findMany({ where: { role: 'INSTRUCTOR' } });
  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });

  if (!admin) throw new Error('No admin found — run the main seed first');

  console.log(`📦 Found ${existingDojos.length} dojos, ${existingInstructors.length} instructors, admin: ${admin.name}`);

  // ── Step 2: Create additional dojos ──────────────────
  const newDojoData = CITIES.filter(c => !existingDojos.some(d => d.dojoCode === c.code)).slice(0, 5);
  const newDojos = [];
  for (const d of newDojoData) {
    const dojo = await prisma.dojo.create({
      data: {
        name: `Kyokushin Dojo ${d.city}`,
        dojoCode: d.code,
        city: d.city,
        state: d.state,
        country: 'India',
        address: `Main Karate Hall, ${d.city}`,
        contactEmail: `dojo.${d.code.toLowerCase()}@kkfi.in`,
      },
    });
    newDojos.push(dojo);
  }
  console.log(`🏯 Created ${newDojos.length} new dojos`);

  const allDojos = [...existingDojos, ...newDojos];

  // ── Step 3: Create additional instructors (1 per new dojo) ──
  const newInstructors = [];
  const instructorNames = ['Sensei Ravi Chauhan', 'Sensei Deepak Rajput', 'Sensei Manish Thakur', 'Sensei Vikram Patil', 'Sensei Suresh Nair'];
  for (let i = 0; i < Math.min(newDojos.length, instructorNames.length); i++) {
    const instructor = await prisma.user.create({
      data: {
        email: `instructor.${newDojos[i].dojoCode.toLowerCase()}@kkfi.in`,
        passwordHash,
        name: instructorNames[i],
        role: 'INSTRUCTOR',
        membershipStatus: 'ACTIVE',
        currentBeltRank: pick(['Black', 'Black 1st Dan', 'Black 2nd Dan', 'Black 3rd Dan']),
        dojoId: newDojos[i].id,
        city: newDojos[i].city,
        state: newDojos[i].state || undefined,
        country: 'India',
        phone: `98${randInt(10000000, 99999999)}`,
        membershipNumber: `KKFI-INS${String(existingInstructors.length + i + 1).padStart(4, '0')}`,
        membershipStartDate: new Date('2024-01-01'),
        membershipEndDate: new Date('2027-01-01'),
        isInstructorApproved: true,
        approvedBy: admin.id,
        approvedAt: new Date(),
      },
    });
    newInstructors.push(instructor);
  }
  console.log(`🥋 Created ${newInstructors.length} new instructors`);

  const allInstructors = [...existingInstructors, ...newInstructors];
  // Map each dojo to its instructor(s)
  const dojoInstructorMap = new Map<string, string>();
  for (const inst of allInstructors) {
    if (inst.dojoId) dojoInstructorMap.set(inst.dojoId, inst.id);
  }

  // ── Step 4: Create 300 students ──────────────────────
  console.log('\n👥 Creating 300 students...');
  const students: any[] = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < 300; i++) {
    const isMale = Math.random() > 0.35; // 65% male
    const firstName = isMale ? pick(FIRST_NAMES_MALE) : pick(FIRST_NAMES_FEMALE);
    const lastName = pick(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;

    // Unique email
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1, 999)}@student.kkfi.in`;
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randInt(1, 9999)}@student.kkfi.in`;
    }
    usedEmails.add(email);

    const dojo = pick(allDojos);
    const instructorId = dojoInstructorMap.get(dojo.id) || allInstructors[0].id;

    // Age distribution: kids (8-11): 15%, teens (12-17): 25%, adults (18-35): 45%, seniors (36-50): 15%
    const ageRoll = Math.random();
    let minAge: number, maxAge: number;
    if (ageRoll < 0.15) { minAge = 8; maxAge = 11; }
    else if (ageRoll < 0.40) { minAge = 12; maxAge = 17; }
    else if (ageRoll < 0.85) { minAge = 18; maxAge = 35; }
    else { minAge = 36; maxAge = 50; }

    const dob = randomDob(minAge, maxAge);
    const age = getAge(dob);

    // Weight based on age
    let weight: number;
    if (age < 12) weight = randInt(25, 45);
    else if (age < 16) weight = randInt(35, 65);
    else if (age < 18) weight = randInt(50, 80);
    else weight = randInt(55, 105);

    const height = age < 12 ? randInt(120, 155) : age < 18 ? randInt(145, 180) : randInt(155, 195);
    const belt = weightedPick(BELTS, BELT_WEIGHTS);

    // 80% are ACTIVE (approved), 15% PENDING, 5% EXPIRED
    const statusRoll = Math.random();
    let membershipStatus: 'ACTIVE' | 'PENDING' | 'EXPIRED';
    let isApproved: boolean;
    let membershipNumber: string | null;

    if (statusRoll < 0.80) {
      membershipStatus = 'ACTIVE';
      isApproved = true;
      membershipNumber = `KKFI-STD${String(i + 10).padStart(4, '0')}`;
    } else if (statusRoll < 0.95) {
      membershipStatus = 'PENDING';
      isApproved = false;
      membershipNumber = null;
    } else {
      membershipStatus = 'EXPIRED';
      isApproved = true;
      membershipNumber = `KKFI-STD${String(i + 10).padStart(4, '0')}`;
    }

    students.push({
      email,
      passwordHash,
      name: fullName,
      role: 'STUDENT' as const,
      membershipStatus,
      currentBeltRank: belt,
      dojoId: dojo.id,
      primaryInstructorId: instructorId,
      city: dojo.city,
      state: dojo.state || undefined,
      country: 'India',
      phone: `${pick(['91','92','93','94','95','96','97','98','99'])}${randInt(10000000, 99999999)}`,
      countryCode: '+91',
      dateOfBirth: dob,
      height,
      weight,
      isInstructorApproved: isApproved,
      instructorApprovedAt: isApproved ? new Date() : undefined,
      approvedBy: isApproved ? admin.id : undefined,
      approvedAt: isApproved ? new Date() : undefined,
      membershipNumber,
      membershipStartDate: membershipStatus === 'ACTIVE' ? new Date('2025-01-01') : undefined,
      membershipEndDate: membershipStatus === 'ACTIVE' ? new Date('2026-12-31') : membershipStatus === 'EXPIRED' ? new Date('2025-06-30') : undefined,
      fatherName: age < 18 ? `${pick(FIRST_NAMES_MALE)} ${lastName}` : undefined,
      fatherPhone: age < 18 ? `98${randInt(10000000, 99999999)}` : undefined,
    });

    if ((i + 1) % 50 === 0) process.stdout.write(`   ${i + 1}/300 prepared\n`);
  }

  // Batch create students
  await prisma.user.createMany({ data: students });
  console.log('✅ 300 students inserted!\n');

  // ── Step 5: Create belt history for each student ─────
  console.log('📜 Creating belt histories...');
  const createdStudents = await prisma.user.findMany({
    where: { role: 'STUDENT', email: { endsWith: '@student.kkfi.in' } },
    select: { id: true, currentBeltRank: true, primaryInstructorId: true },
  });

  const beltHistories = createdStudents.map(s => ({
    studentId: s.id,
    oldBelt: null as string | null,
    newBelt: s.currentBeltRank || 'White',
    promotedBy: s.primaryInstructorId || allInstructors[0].id,
    promotionDate: new Date(),
    notes: 'Initial belt assignment during registration',
  }));

  await prisma.beltHistory.createMany({ data: beltHistories });
  console.log(`✅ ${beltHistories.length} belt histories created\n`);

  // ── Step 6: Create an upcoming tournament ────────────
  console.log('🏆 Creating upcoming tournament...');
  const tournament = await prisma.event.create({
    data: {
      type: 'TOURNAMENT',
      name: 'KKFI National Championship 2026',
      description: 'The flagship national tournament of the Kyokushin Karate Foundation of India. Open to all active members across all age groups and weight classes. Full-contact kumite with single-elimination brackets.',
      startDate: new Date('2026-04-15'),
      endDate: new Date('2026-04-17'),
      location: 'Jawaharlal Nehru Indoor Stadium, Delhi',
      registrationDeadline: new Date('2026-04-01'),
      maxParticipants: 500,
      memberFee: 500,
      nonMemberFee: 1000,
      createdBy: admin.id,
      status: 'UPCOMING',
      categories: [
        // Kids
        { age: 'Under 12', weight: 'Under 35kg', belt: 'Open' },
        { age: 'Under 12', weight: '35-45kg', belt: 'Open' },
        // Teens
        { age: '12-15', weight: '35-45kg', belt: 'Open' },
        { age: '12-15', weight: '45-55kg', belt: 'Open' },
        { age: '12-15', weight: '55kg+', belt: 'Open' },
        // Junior
        { age: '16-17', weight: 'Under 60kg', belt: 'Open' },
        { age: '16-17', weight: '60-70kg', belt: 'Open' },
        { age: '16-17', weight: '70-80kg', belt: 'Open' },
        // Senior adult
        { age: '18-35', weight: 'Under 60kg', belt: 'Open' },
        { age: '18-35', weight: '60-70kg', belt: 'Open' },
        { age: '18-35', weight: '70-80kg', belt: 'Open' },
        { age: '18-35', weight: '80kg+', belt: 'Open' },
        // Veterans
        { age: '36+', weight: 'Under 70kg', belt: 'Open' },
        { age: '36+', weight: '70kg+', belt: 'Open' },
      ],
    },
  });
  console.log(`✅ Tournament created: "${tournament.name}" (ID: ${tournament.id})\n`);

  // ── Summary ──────────────────────────────────────────
  const totalUsers = await prisma.user.count();
  const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
  const activeStudents = await prisma.user.count({ where: { role: 'STUDENT', membershipStatus: 'ACTIVE' } });
  const pendingStudents = await prisma.user.count({ where: { role: 'STUDENT', membershipStatus: 'PENDING' } });
  const totalDojos = await prisma.dojo.count();
  const totalInstructors = await prisma.user.count({ where: { role: 'INSTRUCTOR' } });

  console.log('═══════════════════════════════════════════');
  console.log('             SEED SUMMARY');
  console.log('═══════════════════════════════════════════');
  console.log(`  Total Users:        ${totalUsers}`);
  console.log(`  Students:           ${totalStudents} (Active: ${activeStudents}, Pending: ${pendingStudents})`);
  console.log(`  Instructors:        ${totalInstructors}`);
  console.log(`  Dojos:              ${totalDojos}`);
  console.log(`  Tournament:         ${tournament.name}`);
  console.log(`  Tournament ID:      ${tournament.id}`);
  console.log('═══════════════════════════════════════════');
  console.log('  Password for all:   password123');
  console.log('═══════════════════════════════════════════\n');

  // Age/weight distribution
  const ageGroups: Record<string, number> = {};
  const weightGroups: Record<string, number> = {};
  for (const s of students) {
    const age = getAge(s.dateOfBirth);
    const ageCat = getAgeCategory(age);
    const weightCat = getWeightCategory(s.weight, age);
    ageGroups[ageCat] = (ageGroups[ageCat] || 0) + 1;
    weightGroups[weightCat] = (weightGroups[weightCat] || 0) + 1;
  }
  console.log('📊 Age Distribution:', ageGroups);
  console.log('📊 Weight Distribution:', weightGroups);

  const beltDist: Record<string, number> = {};
  for (const s of students) {
    beltDist[s.currentBeltRank] = (beltDist[s.currentBeltRank] || 0) + 1;
  }
  console.log('📊 Belt Distribution:', beltDist);

  // Dojo distribution
  const dojoDist: Record<string, number> = {};
  for (const s of students) {
    const dojoName = allDojos.find(d => d.id === s.dojoId)?.name || 'Unknown';
    dojoDist[dojoName] = (dojoDist[dojoName] || 0) + 1;
  }
  console.log('📊 Dojo Distribution:', dojoDist);

  await prisma.$disconnect();
  console.log('\n🎉 Done! You can now test registrations and bracket generation.');
}

main().catch((e) => {
  console.error('❌ Seed error:', e);
  process.exit(1);
});
