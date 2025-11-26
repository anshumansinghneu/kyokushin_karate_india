# End-to-End Testing Guide - Kyokushin Karate Tournament System

This guide provides step-by-step instructions for testing the complete tournament management system through the UI.

---

## Prerequisites

### Quick Setup with Seed Script

**⚠️ IMPORTANT: Choose Your Testing Environment**

#### Option A: Local Testing (Recommended)

Test with local database - fastest and safest for development:

```bash
# Step 1: Seed local database
cd backend
npm run seed:test

# Step 2: Start local servers
cd ..
./run-local.sh

# Or manually:
# Terminal 1: cd backend && npm run dev
# Terminal 2: cd frontend && npm run dev
```

Then open: `http://localhost:3000`

#### Option B: Production Testing

Seed the production database (⚠️ creates test data in production):

```bash
# Get your production DATABASE_URL from Render
# Render Dashboard → Backend Service → Environment → DATABASE_URL

# Set it as environment variable
export PRODUCTION_DATABASE_URL='your-render-postgres-url'

# Run production seed
./seed-production.sh
```

Then use your production URL to login.

**What gets created:**
- ✅ 1 Admin account
- ✅ 4 Instructor accounts (one per dojo)
- ✅ 16 Student accounts (4 per dojo)
- ✅ 4 Dojos (Mumbai, Delhi, Bangalore, Pune)
- ✅ 1 Tournament with all students registered and approved
- ✅ Training session history for some students

**All accounts use password**: `password123`

**Account Emails:**
- Admin: `admin@kyokushin.in`
- Instructors: `instructor1@kyokushin.in` to `instructor4@kyokushin.in`
- Students: `student1@kyokushin.in` to `student16@kyokushin.in`

### Manual Access Credentials
If you prefer to create accounts manually:
- **Admin Account**: Required for full tournament management
- **Instructor Account**: For participant management and viewing
- **Student Account**: For registration testing
- **URLs**:
  - Frontend: `https://your-frontend-url.vercel.app`
  - Backend API: `https://your-backend-url.onrender.com/api`

---

## Test Scenario 1: Tournament Creation & Setup

> **💡 Skip to Scenario 4**: If you ran the seed script, a tournament is already created with approved participants. You can jump directly to **Test Scenario 4: Bracket Generation**.

### 1.1 Create Tournament Event (Admin)
1. **Login** as Admin (`admin@kyokushin.in` / `password123`)
2. Navigate to **Dashboard → Events**
3. Click **"Create New Event"**
4. Fill tournament details:
   - Event Type: `TOURNAMENT`
   - Name: `National Kyokushin Championship 2025`
   - Start Date: (Choose future date)
   - End Date: (Same or next day)
   - Location: `Mumbai, Maharashtra`
   - Registration Deadline: (Before start date)
   - Member Fee: `1000`
   - Non-Member Fee: `1500`
   - Max Participants: `100`
5. Add Categories (JSON format):
   ```json
   [
     {"age": "18-35", "weight": "Under 70kg", "belt": "Brown"},
     {"age": "18-35", "weight": "Under 80kg", "belt": "Black"},
     {"age": "36-45", "weight": "Open", "belt": "Open"}
   ]
   ```
6. Click **"Create Event"**
7. **Verify**: Event appears in events list with status `UPCOMING`

---

## Test Scenario 2: Student Registration

> **💡 Skip this scenario**: If you ran the seed script, 16 students are already registered and approved for the tournament.

### 2.1 Student Self-Registration
1. **Logout** from Admin account
2. Navigate to **Events** page (public view)
3. Find the tournament you created
4. Click **"View Details"**
5. Click **"Register Now"**
6. Login as student (e.g., `student1@kyokushin.in` / `password123`)
7. Fill registration form:
   - Select Category Age: `18-35`
   - Select Category Weight: `Under 70kg`
   - Select Category Belt: `Brown`
   - Event Type: `Kumite` or `Both`
8. Click **"Submit Registration"**
9. **Verify**: Registration status shows `PENDING` approval

### 2.2 Multiple Student Registrations
1. Repeat 2.1 with different student accounts (`student2@kyokushin.in`, etc.)
2. Mix categories to test bracket generation
3. **Verify**: All registrations appear in event details

---

## Test Scenario 3: Registration Approval (Admin)

> **💡 Skip this scenario**: If you ran the seed script, all registrations are already approved.

### 3.1 Approve Participants
1. **Login** as Admin (`admin@kyokushin.in` / `password123`)
2. Navigate to **Dashboard → Events**
3. Click on your tournament
4. Go to **"Registrations"** tab
5. Review each registration:
   - Check participant details
   - Verify category selections
6. Click **"Approve"** for each valid registration
7. **Verify**: Registration status changes to `APPROVED`
8. **Verify**: Approved count updates in event details

---

## Test Scenario 4: Bracket Generation

### 4.1 Generate Tournament Brackets
1. In **Admin Dashboard → Tournaments** tab
2. Click **"View Details & Brackets"** on your tournament
3. Click **"Generate Brackets"** button
4. **Confirm** generation in dialog
5. **Wait** for generation to complete (~5-10 seconds)
6. **Verify**:
   - Brackets appear for each category
   - Matches are created in elimination format
   - First round shows all approved participants
   - Byes are assigned if needed (non-power of 2)

### 4.2 Review Bracket Structure
1. Switch to **"Tournament Brackets"** tab
2. Select each category
3. **Verify**:
   - Proper seeding (higher belts seeded appropriately)
   - Round names: Round 1, Quarter-Finals, Semi Finals, Final
   - All matches show fighter names and belt ranks
   - Match status is `SCHEDULED`

---

## Test Scenario 5: Live Match Scoring

### 5.1 Start a Match
1. In **Bracket Viewer**, find a Round 1 match
2. Click **"Start Match"** button (green)
3. **Verify**:
   - Match status changes to `LIVE`
   - Border turns red with pulsing animation
   - "LIVE MATCH" indicator appears

### 5.2 Score a Live Match
1. Click **"Update Score"** button on LIVE match
2. In scoring modal:
   - Use **+** button to increment Fighter A score (e.g., 3 points)
   - Use **+** button to increment Fighter B score (e.g., 1 point)
   - Observe **Winner Preview** showing higher scorer
3. Click **"Complete Match"**
4. **Verify**:
   - Match status changes to `COMPLETED`
   - Border turns green
   - Winner has crown icon and golden background
   - Winner advances to next round match
   - Next round match shows winner's name

### 5.3 Score Multiple Matches
1. Repeat 5.1-5.2 for all Round 1 matches
2. Continue with Quarter-Finals
3. Continue with Semi-Finals
4. Complete the Final match
5. **Verify**:
   - Winners properly advance through rounds
   - Semi-final losers remain visible for 3rd place
   - Final winner receives 1st place
   - Final loser receives 2nd place

---

## Test Scenario 6: Real-Time Updates (Public View)

### 6.1 Open Public Tournament Viewer
1. Open new browser tab/window (incognito mode)
2. Navigate to `/tournaments/[tournament-id]/view`
3. **No login required**
4. **Verify**:
   - Tournament details displayed
   - Live updates indicator shows "Live updates active"
   - WiFi icon is green

### 6.2 Test Real-Time Match Updates
1. Keep public viewer open
2. In admin window, score a match:
   - Start match
   - Update scores multiple times
   - Complete match
3. **Watch public viewer** (no refresh needed):
   - Match status updates instantly
   - Scores update in real-time
   - Winner appears immediately
   - No 30-second delay

### 6.3 Test Connection Toggle
1. In public viewer, toggle **"Live updates"** OFF
2. **Verify**: WiFi icon turns gray, shows "disconnected"
3. Score a match in admin view
4. **Verify**: Public viewer does NOT update
5. Toggle **"Live updates"** ON
6. **Verify**: Reconnects, shows latest data

---

## Test Scenario 7: Tournament Results & Statistics

### 7.1 View Results Page
1. Navigate to `/tournaments/[tournament-id]/results`
2. **Verify Tournament Stats**:
   - Total Categories: Matches category count
   - Total Participants: Matches approved registrations
   - Matches Completed: Shows completed match count
   - Dojos: Shows participating dojo count

### 7.2 Review Dojo Podium
1. Check **"Top Performing Dojos"** section
2. **Verify**:
   - 1st place dojo has tallest podium (gold)
   - 2nd place dojo has medium podium (silver)
   - 3rd place dojo has shortest podium (bronze)
   - Medal counts (🥇🥈🥉) are accurate

### 7.3 Check Performance Highlights
1. Review **"Fastest Win"** card:
   - Shows match duration in minutes
   - Displays winner name and dojo
2. Review **"Highest Score"** card:
   - Shows maximum points scored
   - Displays winner details
3. Review **"Most Dominant"** card:
   - Shows largest score differential
   - Displays final score (e.g., "5-0")

### 7.4 Verify Category Champions
1. Scroll to **"Category Champions"** section
2. For each category, verify:
   - 1st place: Gold border and medal icon
   - 2nd place: Silver border and medal icon
   - 3rd place: Bronze border and medal icon
   - Names and dojos match bracket results

### 7.5 Check Dojo Leaderboard
1. Review full **"Dojo Medal Standings"** table
2. **Verify**:
   - Ranking order (most golds first)
   - Accurate medal counts per dojo
   - Total medals calculated correctly

---

## Test Scenario 8: Certificate Generation

### 8.1 Download Individual Certificate
1. In **Results Page**, find a category winner
2. **Hover** over the winner card
3. Click **FileCheck icon** that appears
4. **Verify**:
   - PDF downloads automatically
   - Filename: `ParticipantName_Certificate_1st_Place.pdf`
   - Open PDF and verify:
     - Black background with red border
     - Participant name in gold
     - Correct position (1st/2nd/3rd)
     - Category name displayed
     - Tournament name and date
     - Dojo name shown
     - Professional layout

### 8.2 Bulk Certificate Download
1. Click **"Download All Certificates"** button (header)
2. **Wait** for sequential downloads (~0.5s between each)
3. **Verify**:
   - All winners' certificates downloaded
   - 3 certificates per category (1st, 2nd, 3rd)
   - Unique filenames for each certificate

---

## Test Scenario 9: Mobile Responsiveness

### 9.1 Test on Mobile Device
1. Open site on mobile phone or use DevTools responsive mode
2. Test **Tournament Viewer**:
   - Horizontal scroll for brackets works smoothly
   - Match cards are readable
   - Controls are accessible
3. Test **Results Page**:
   - Podium displays correctly
   - Stats cards stack vertically
   - Tables are scrollable
   - Leaderboard is readable

### 9.2 Test Share Functionality
1. On mobile, click **"Share"** button
2. **Verify**:
   - Native share sheet appears (iOS/Android)
   - Can share to WhatsApp, Email, etc.
3. On desktop, click **"Share"**
4. **Verify**: Link copied to clipboard message appears

---

## Test Scenario 10: Global Search (Dashboard)

### 10.1 Test Search Functionality
1. **Login** as Admin or Instructor
2. Press **Cmd+K** (Mac) or **Ctrl+K** (Windows)
3. **Verify**: Search modal opens with focus on input
4. Type student name (partial match)
5. **Verify**:
   - Dropdown shows matching students
   - Shows name, belt rank, dojo, status
   - Max 20 results displayed
6. Use **Arrow Keys** to navigate results
7. Press **Enter** to select
8. **Verify**: Student detail view opens

### 10.2 Test Search by Different Fields
1. Search by email address
2. Search by phone number
3. Search by membership ID
4. **Verify**: All search types return correct results

---

## Test Scenario 11: Student Detail View

### 11.1 View Student Profile
1. In Dashboard, click on any student
2. Navigate through all **6 tabs**:
   - **Overview**: Basic info, belt rank, membership status
   - **Belt History**: Promotion timeline with dates
   - **Training**: Session attendance records
   - **Tournaments**: Past tournament participations
   - **Notes**: Add/view notes (instructor/admin only)
   - **Timeline**: Activity log
3. **Verify**: All data displays correctly

### 11.2 Add Student Note
1. Go to **"Notes"** tab
2. Type note text: `Test note for student progress`
3. Check **"Private"** checkbox
4. Click **"Add Note"**
5. **Verify**:
   - Note appears in timeline
   - Purple "Private" badge visible
   - Timestamp shows correctly
6. Try deleting the note
7. **Verify**: Note removed from list

---

## Test Scenario 12: Organization Chart

### 12.1 Test Chart Features
1. Navigate to **Dashboard → Organization**
2. **Verify**: Hierarchical chart displays
3. Test **Zoom Controls**:
   - Click **Zoom In**: Chart enlarges
   - Click **Zoom Out**: Chart shrinks
   - Mouse wheel: Smooth zoom
   - **Verify**: Zoom percentage updates (50% - 300%)
4. Test **Pan**:
   - Click and drag chart
   - **Verify**: Chart moves smoothly
   - Cursor changes to grab/grabbing
5. Click **"Reset Zoom"** (Maximize2 icon)
6. **Verify**: Chart returns to 100%

### 12.2 Export Chart
1. Click **"Download"** button
2. **Verify**:
   - PNG file downloads
   - Image shows full chart at original zoom
   - Clear and readable

### 12.3 Expand/Collapse
1. Click **"Collapse All"**
2. **Verify**: Only top level visible
3. Click **"Expand All"**
4. **Verify**: All branches expand

---

## Test Scenario 13: Belt Promotions

### 13.1 Promote Student
1. In **Dashboard → Students** (Instructor)
2. Find eligible student (180+ days since last promotion)
3. Click **"Promote"** button
4. Select new belt rank (next level up)
5. Add notes: `Excellent kata performance`
6. Click **"Confirm Promotion"**
7. **Verify**:
   - Student's current belt rank updates
   - Belt history shows new entry
   - Eligibility date resets to +180 days
   - Toast notification appears

### 13.2 Test Promotion Restrictions
1. Try promoting same student immediately
2. **Verify**: Promotion disabled/grayed out
3. Tooltip shows: "Not eligible - Last promoted X days ago"

---

## Common Issues & Troubleshooting

### Issue: Brackets Don't Generate
**Solution**: 
- Ensure at least 2 approved participants per category
- Check registration categories match event categories
- Look for console errors in DevTools

### Issue: Live Updates Not Working
**Solution**:
- Check WebSocket connection (green WiFi icon)
- Ensure CORS configured correctly on backend
- Verify `FRONTEND_URL` environment variable
- Check browser console for Socket.io errors

### Issue: Certificates Don't Download
**Solution**:
- Check browser pop-up blocker settings
- Try downloading one at a time
- Verify jsPDF library loaded (check DevTools console)

### Issue: Search Not Finding Users
**Solution**:
- Verify user exists in database
- Check role permissions (instructors only see assigned students)
- Ensure minimum 2 characters typed

### Issue: Real-Time Updates Delayed
**Solution**:
- Check network latency
- Verify backend Socket.io server running
- Check if multiple tabs open (connection limit)

---

## Test Completion Checklist

- [ ] Tournament created successfully
- [ ] Students registered and approved
- [ ] Brackets generated for all categories
- [ ] Matches scored with live updates
- [ ] Winners advance through rounds correctly
- [ ] Real-time updates work in public viewer
- [ ] Results page shows accurate statistics
- [ ] Certificates download successfully
- [ ] Mobile view is responsive
- [ ] Global search finds students
- [ ] Student detail view displays all data
- [ ] Organization chart is interactive
- [ ] Belt promotions work correctly
- [ ] All tabs and navigation functional

---

## Performance Benchmarks

### Expected Response Times
- **Page Load**: < 2 seconds
- **Bracket Generation**: < 10 seconds (50 participants)
- **Match Score Update**: < 500ms
- **Real-Time Broadcast**: < 100ms
- **Certificate Generation**: < 1 second per PDF
- **Search Results**: < 200ms

### Browser Compatibility
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile Safari (iOS 14+)
- ✅ Chrome Mobile (Android 10+)

---

## Reporting Issues

When reporting bugs, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Screenshots/videos**
5. **Browser and version**
6. **Console errors** (F12 → Console tab)
7. **Network errors** (F12 → Network tab)

---

## Additional Resources

- **API Documentation**: `/backend/API_DOCS.md`
- **System Documentation**: `/SYSTEM_DOCUMENTATION.md`
- **Feature Roadmap**: `/FEATURE_ROADMAP.md`
- **Backend Testing**: `/backend/scripts/e2e_test.ts`

---

**Last Updated**: November 26, 2025
**Version**: 1.0.0
