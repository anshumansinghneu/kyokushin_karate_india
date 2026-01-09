# Tournament System - Quick Reference

## 🎯 What's Been Implemented

### ✅ Enhanced Test Data Seeding

- **32 realistic students** (up from 16)
- **4 dojos** with 8 students each
- **Proper age/weight/belt distribution**
- **8 tournament categories** for comprehensive testing
- **Auto-registration** to appropriate categories

### ✅ Intelligent Bracket Seeding

- **Belt-based seeding** (Black Dan → White)
- **Standard pairing** (1v8, 2v7, 3v6, 4v5)
- **Bye handling** for non-power-of-2 participants
- **Winner auto-advancement** to next rounds
- **Round naming** (Quarter Finals, Semi Finals, Final)

### ✅ Real-Time Features

- **Live match scoring** with increment/decrement
- **WebSocket updates** for instant bracket changes
- **Public tournament viewer** (no auth required)
- **Connection status** indicators

### ✅ Statistics & Analytics

- **Tournament results page** with podium
- **Dojo medal standings** (gold, silver, bronze)
- **Performance stats** (fastest win, highest score, most dominant)
- **Category champions** display

### ✅ Certificate Generation

- **PDF certificates** using jsPDF
- **Individual downloads** per winner
- **Bulk download** all certificates
- **Professional design** with position-based colors

---

## 🚀 Quick Start Guide

### 1. Seed Test Data

```bash
cd backend
npm run seed:test
```

**What gets created:**

- 1 Admin, 4 Instructors, 32 Students
- 4 Dojos (Mumbai, Delhi, Bangalore, Pune)
- 1 Tournament with 32 approved registrations
- 24 Training session records

### 2. Start Local Environment

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

**URLs:**

- Frontend: http://localhost:3000
- Backend: http://localhost:8000

### 3. Login & Test

**Credentials:**

- Admin: `admin@kyokushin.in` / `password123`
- Students: `student1@kyokushin.in` to `student32@kyokushin.in`
- Instructors: `instructor1@kyokushin.in` to `instructor4@kyokushin.in`

**Testing Flow:**

1. Login as admin
2. Go to **Tournaments** tab
3. Click tournament → **"Generate Brackets"**
4. Start scoring matches using **+/- buttons**
5. Open public viewer in new tab (no login)
6. Watch **real-time updates** via WebSocket
7. Complete tournament → View **Results** page
8. Download **certificates** for winners

---

## 📊 Data Distribution

### Age Groups (32 students total)

| Age Range | Count | Percentage |
| --------- | ----- | ---------- |
| 18-25     | 8     | 25%        |
| 26-35     | 12    | 37.5%      |
| 36-45     | 8     | 25%        |
| 46-55     | 4     | 12.5%      |

### Weight Classes

| Weight Class | Count | Percentage |
| ------------ | ----- | ---------- |
| Under 65kg   | 8     | 25%        |
| 65-75kg      | 12    | 37.5%      |
| 75-85kg      | 8     | 25%        |
| Over 85kg    | 4     | 12.5%      |

### Belt Distribution (Pyramid Structure)

| Belt Rank     | Count | Percentage |
| ------------- | ----- | ---------- |
| White         | 4     | 12.5%      |
| Yellow        | 2     | 6.25%      |
| Orange        | 2     | 6.25%      |
| Blue          | 2     | 6.25%      |
| Green         | 2     | 6.25%      |
| Brown         | 2     | 6.25%      |
| Black 1st Dan | 2     | 6.25%      |

---

## 🏆 Tournament Categories

### Age/Weight Combinations (6 categories)

1. **18-25, Under 65kg, Open** → ~4 fighters
2. **18-25, Under 75kg, Open** → ~4 fighters
3. **26-35, Under 75kg, Open** → ~6 fighters
4. **26-35, Under 85kg, Open** → ~6 fighters
5. **36-45, Under 85kg, Open** → ~4 fighters
6. **36-45, Over 85kg, Open** → ~4 fighters

### Belt-Specific (2 categories)

7. **Open, Open, White-Yellow** → Beginner divisions
8. **Open, Open, Brown-Black** → Advanced divisions

---

## 🎲 Bracket Seeding Logic

### Seeding Formula

```
participants.sort((a, b) => {
    beltA = getBeltValue(a.belt)  // Black=7, Brown=6, etc.
    beltB = getBeltValue(b.belt)
    return beltB - beltA  // Highest belt first
})
```

### Pairing System (8-Fighter Example)

```
Seed #1 ──┐
           ├── Match 1
Seed #8 ──┘            ┐
                        ├── Semi Final 1
Seed #4 ──┐            │
           ├── Match 2 ┘
Seed #5 ──┘                        ┐
                                    ├── FINAL
Seed #2 ──┐                        │
           ├── Match 3             │
Seed #7 ──┘            ┐           │
                        ├── Semi Final 2
Seed #3 ──┐            │
           ├── Match 4 ┘
Seed #6 ──┘
```

### Bye Assignment (6 Fighters)

- Bracket size = 8 (next power of 2)
- Byes needed = 8 - 6 = 2
- Seed #1 & #2 get byes (highest belts)
- Auto-advance to Round 2

---

## 📡 Real-Time Updates

### WebSocket Events

| Event              | Trigger            | Payload                  |
| ------------------ | ------------------ | ------------------------ |
| `match:update`     | Score changes      | Match data with fighters |
| `bracket:refresh`  | Match completes    | Tournament ID            |
| `join-tournament`  | Viewer connects    | Tournament ID            |
| `leave-tournament` | Viewer disconnects | Tournament ID            |

### Connection Flow

```
1. Frontend connects to SOCKET_URL
2. Emit join-tournament(tournamentId)
3. Backend adds socket to room: tournament-${id}
4. Admin scores match
5. Backend emits to room: match:update
6. All viewers receive instant update
7. On disconnect: leave-tournament
```

---

## 📈 Statistics Calculation

### Performance Stats

```typescript
// Fastest Win
duration = match.completedAt - match.startedAt
fastest = Math.min(all durations)

// Highest Score
highest = Math.max(fighterAScore, fighterBScore)

// Most Dominant
differential = Math.abs(fighterAScore - fighterBScore)
mostDominant = Math.max(all differentials)
```

### Medal Counts

```typescript
// Per Dojo
Gold = Count of 1st place finishes
Silver = Count of 2nd place finishes
Bronze = Count of 3rd place finishes
Total = Gold + Silver + Bronze

// Leaderboard Sort
1. Most golds
2. If tied, most silvers
3. If tied, most bronzes
4. If tied, most total
```

---

## 🎨 Certificate Design

### Layout (Landscape A4)

- **Background**: Black (#000000)
- **Border**: Red (#DC2626) 2mm thick
- **Title**: "CERTIFICATE OF ACHIEVEMENT" (36pt, red)
- **Participant Name**: Gold (#FFD700, 32pt, uppercase)
- **Position Text**:
  - 1st Place: 🥇 FIRST PLACE (gold)
  - 2nd Place: 🥈 SECOND PLACE (silver)
  - 3rd Place: 🥉 THIRD PLACE (bronze)

### Data Included

- Tournament name & date
- Participant name (gold, bold)
- Position with medal emoji
- Category name
- Dojo affiliation
- Location
- Signature lines
- Footer: "Kyokushin Karate Federation of India"

---

## 📚 Documentation Files

| File                             | Purpose                              |
| -------------------------------- | ------------------------------------ |
| `TESTING_GUIDE.md`               | Complete E2E testing instructions    |
| `BRACKET_ALGORITHM.md`           | Seeding logic & tournament structure |
| `backend/scripts/SEED_README.md` | Seed script documentation            |
| `SYSTEM_DOCUMENTATION.md`        | Overall system architecture          |
| `API_DOCS.md`                    | Backend API endpoints                |

---

## 🔧 Troubleshooting

### Seed Script Fails

```bash
# Check database connection
cd backend
npx prisma studio

# Reset database
npx prisma migrate reset

# Run seed again
npm run seed:test
```

### WebSocket Not Connecting

- Check backend is running on port 8000
- Verify CORS settings in `backend/src/index.ts`
- Check browser console for Socket.io errors
- Try toggling "Live updates" off/on

### Brackets Not Generating

- Need at least 2 approved participants per category
- Check registration categories match event categories
- Look for console errors in browser DevTools
- Verify backend logs for errors

### Certificates Not Downloading

- Check browser pop-up blocker settings
- Try downloading one at a time
- Verify jsPDF loaded (check DevTools → Network)
- Clear browser cache and retry

---

## 🎯 Testing Checklist

- [ ] Login as admin works
- [ ] Seed script creates 32 students
- [ ] Tournament appears in dashboard
- [ ] All 32 registrations are approved
- [ ] "Generate Brackets" creates matches
- [ ] Each category has proper seeding (high belts first)
- [ ] Byes assigned to top seeds
- [ ] "Start Match" changes status to LIVE
- [ ] +/- buttons update scores in real-time
- [ ] "Complete Match" advances winner
- [ ] Public viewer shows live updates without auth
- [ ] WebSocket connection indicator works (WiFi icon)
- [ ] Results page shows accurate statistics
- [ ] Podium displays top 3 dojos correctly
- [ ] Category champions listed with positions
- [ ] Individual certificate downloads work
- [ ] "Download All Certificates" works
- [ ] Certificates have correct names/positions
- [ ] Mobile view is responsive

---

## 🌟 Key Features Summary

1. **Realistic Test Data**: 32 students with proper age/weight/belt distribution
2. **Smart Seeding**: Belt-based ranking ensures fair matchups
3. **Live Scoring**: Real-time updates via WebSocket
4. **Public Access**: Anyone can watch tournaments without login
5. **Rich Analytics**: Performance stats and medal standings
6. **Professional Certificates**: Auto-generated PDFs for winners
7. **Complete Documentation**: Guides for testing, development, and algorithms

---

**OSU! Happy Testing! 🥋**

Last Updated: November 26, 2025
