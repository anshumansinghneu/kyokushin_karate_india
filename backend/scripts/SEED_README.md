# Test Account Seed Script

This script automatically creates a complete test environment for E2E testing of the tournament system.

## What Gets Created

### Accounts (Password: `password123` for all)

**1 Admin Account:**

- `admin@kyokushin.in` - Shihan Admin (5th Dan)

**4 Instructor Accounts:**

- `instructor1@kyokushin.in` - Sensei Ravi Kumar (Mumbai)
- `instructor2@kyokushin.in` - Sensei Amit Sharma (Delhi)
- `instructor3@kyokushin.in` - Sensei Vijay Patel (Bangalore)
- `instructor4@kyokushin.in` - Sensei Rahul Singh (Pune)

**16 Student Accounts:**

- `student1@kyokushin.in` to `student16@kyokushin.in`
- 4 students per dojo
- Mixed belt ranks (White to Black)
- Random weights (60-90kg) and ages

### Infrastructure

**4 Dojos:**

1. Mumbai Central Dojo (MUM-01)
2. Delhi Kyokushin Academy (DEL-01)
3. Bangalore Warriors Dojo (BLR-01)
4. Pune Fighting Spirit (PUN-01)

**1 Tournament:**

- Name: National Kyokushin Championship 2025
- Date: December 15-16, 2025
- Location: Mumbai, Maharashtra
- 16 participants registered and APPROVED
- 4 categories:
  - 18-35, Under 70kg, Brown
  - 18-35, Under 80kg, Black
  - 18-35, Over 80kg, Open
  - 36-45, Open, Open

**Training Sessions:**

- 24 training sessions for first 8 students
- 3 sessions each with varied intensity and focus

## Usage

### Method 1: Using npm script (Recommended)

```bash
cd backend
npm run seed:test
```

### Method 2: Direct execution

```bash
cd backend
npx ts-node scripts/seed_test_accounts.ts
```

### Method 3: With environment file

```bash
cd backend
dotenv -e .env -- npx ts-node scripts/seed_test_accounts.ts
```

## Prerequisites

1. **PostgreSQL database** must be running
2. **DATABASE_URL** environment variable must be set in `.env`
3. **Prisma schema** must be up to date (`npx prisma generate`)

## What to Do After Seeding

1. **Login** as admin: `admin@kyokushin.in` / `password123`

2. **Navigate to Tournaments** tab in dashboard

3. **Click "Generate Brackets"** for the tournament

4. **Start scoring matches** using the bracket viewer

5. **Test real-time updates** by opening public viewer in another window

6. **View results** at `/tournaments/[id]/results` after completing matches

7. **Download certificates** for winners from results page

## Testing Scenarios

With this seed data, you can immediately test:

- ✅ Tournament bracket generation with 16 participants
- ✅ Live match scoring with real opponents
- ✅ Real-time WebSocket updates between admin and public viewer
- ✅ Statistics and analytics with actual match data
- ✅ Certificate generation for multiple winners
- ✅ Dojo medal standings with 4 competing dojos
- ✅ Student detail views with training history
- ✅ Instructor dashboard with assigned students
- ✅ Global search across all users

## Resetting the Database

If you want to start fresh, this script clears all existing data automatically. However, if you want to manually reset:

```bash
# Reset database to empty state
npx prisma migrate reset

# Then run seed again
npm run seed:test
```

## Customization

To modify the seed data, edit `backend/scripts/seed_test_accounts.ts`:

- Change number of dojos (line 38)
- Adjust students per dojo (line 97)
- Modify tournament details (line 138)
- Add more belt ranks or categories
- Change default password (line 18)

## Troubleshooting

**Error: Database connection failed**

- Check `.env` file has correct `DATABASE_URL`
- Ensure PostgreSQL is running
- Verify database exists

**Error: Prisma schema out of sync**

```bash
npx prisma generate
npx prisma db push
```

**Error: Unique constraint violation**

- Database already has data with same emails/codes
- Run `npx prisma migrate reset` to clear database
- Or manually delete conflicting records

## Production Warning

⚠️ **DO NOT run this script in production!**

This script is for development and testing only. It:

- Deletes existing data (not explicitly, but conflicts may occur)
- Uses weak passwords
- Creates fake data
- Should only be used in local/staging environments

## Quick Reference

```bash
# Full workflow
cd backend
npm run seed:test          # Create test data
npm run dev                # Start backend server

# In another terminal
cd frontend
npm run dev                # Start frontend

# Login credentials
# Admin: admin@kyokushin.in
# Students: student1@kyokushin.in (through student16)
# All passwords: password123
```

---

**Happy Testing! OSU!** 🥋
