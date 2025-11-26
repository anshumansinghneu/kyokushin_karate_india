# STAGE 3 & 4 IMPLEMENTATION PLAN
**Date Created:** November 26, 2025  
**Target Completion:** November 27-28, 2025

---

## 🎯 STAGE 3: INSTRUCTOR MANAGEMENT PANEL WITH PROMOTIONS

### Overview
Build comprehensive instructor management interface with student promotion capabilities, replacing the basic belt verification with a full-featured management system.

### Features to Implement

#### 3.1 Instructor Dashboard Tabs
**Location:** `/management/instructor` (enhance existing page)

**Tab Structure:**
1. **Overview** (Current - Keep)
2. **Students List** (New)
3. **Belt Approvals** (Already done ✅)
4. **Belt Promotions** (New - Main focus)
5. **Tournament Management** (New)

#### 3.2 Students List Tab
**Purpose:** View and manage all assigned students

**UI Components:**
- Searchable table with filters (belt rank, status, dojo)
- Student cards with:
  - Profile photo
  - Name, membership number
  - Current belt + days since last promotion
  - Training sessions count
  - Quick actions: View Details, Promote, Message
- Export to CSV functionality

**Data to Display:**
```
- Student Name
- Membership ID
- Current Belt
- Last Promotion Date
- Days Since Promotion
- Eligible for Promotion (Yes/No based on 6-month rule)
- Training Attendance %
- Tournament Participations
- Status (Active/Pending/Rejected)
```

**API Endpoints Needed:**
- `GET /api/users/instructor/:instructorId/students` - Get all students
- `GET /api/users/instructor/:instructorId/students/eligible` - Get promotion-eligible students

#### 3.3 Belt Promotions Interface (MAIN FEATURE)
**Location:** `/management/instructor/promotions`

**Flow:**
1. Select student from eligible list
2. Show current belt → next belt progression
3. Instructor inputs promotion date (default: today, can backdate)
4. Add notes (optional)
5. Confirm promotion

**Validation Rules:**
- Check 6-month gap from last promotion
- Instructor cannot promote to their own rank or higher
- Cannot skip belt levels (White → Yellow, not White → Green)
- Date cannot be in future
- Date must be after last promotion date

**UI Features:**
- Visual belt progression indicator
- Automatic next belt suggestion based on current rank
- Date picker with validation
- Rich text editor for notes
- Bulk promotion capability (select multiple students)
- Preview before confirm

**Belt Progression Logic:**
```javascript
White → Orange → Blue → Yellow → Green → Brown → 1st Dan Black → 2nd Dan Black → ...
```

**Database Changes:**
```prisma
// BeltHistory already exists, just use it with:
- studentId
- oldBelt
- newBelt
- promotedBy (instructor ID)
- promotionDate (can be backdated)
- notes
```

**API Endpoints:**
- `POST /api/belts/promote` (Already exists, enhance)
- `GET /api/belts/eligible/:instructorId` (New)
- `POST /api/belts/bulk-promote` (New)

#### 3.4 Tournament Management Tab
**Purpose:** Create and manage tournaments, assign students

**Features:**
- Create tournament (name, date, location, categories)
- Assign students to categories
- View upcoming tournaments
- Track results (basic)

**Later Enhancement:** Full bracket system (defer to future)

---

## 🎯 STAGE 4: ADMIN TOOLS & HIERARCHY

### Overview
Build admin-only tools for global search, organization visualization, and comprehensive student profiles.

### Features to Implement

#### 4.1 Global Search Functionality
**Location:** `/management/admin/search`

**Search Capabilities:**
- Search by name (fuzzy matching)
- Search by membership ID (exact match)
- Search by email
- Search by phone
- Search by dojo
- Search by belt rank
- Multi-filter combination

**UI Components:**
- Search bar with autocomplete
- Filter sidebar (role, belt, dojo, status)
- Results grid/list toggle
- Quick view cards
- Click to open full profile

**Database Update:**
```prisma
model User {
  // Make membershipNumber unique for fast lookups
  membershipNumber String? @unique
  
  // Add search indexes
  @@index([name])
  @@index([email])
  @@index([phone])
}
```

**API Endpoints:**
- `GET /api/admin/search?q={query}&filters={...}` (New)
- `GET /api/admin/users/stats` (New - for dashboard)

#### 4.2 Organization Chart Component
**Location:** `/management/admin/organization`

**Hierarchy Structure:**
```
ADMIN (Sihan Vasant Kumar Singh)
├── Instructor 1 (Mumbai Dojo)
│   ├── Student 1
│   ├── Student 2
│   └── Student 3
├── Instructor 2 (Delhi Dojo)
│   ├── Student 4
│   └── Student 5
└── Instructor 3 (Bangalore Dojo)
    └── Student 6
```

**UI Features:**
- Interactive tree diagram (use react-organizational-chart or similar)
- Zoom in/out
- Click node to view details
- Color coding by belt rank
- Filter by dojo
- Collapse/expand branches
- Export as image/PDF

**Data Structure:**
```typescript
interface OrgNode {
  id: string;
  name: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  belt: string;
  photo: string;
  dojo: string;
  membershipId: string;
  children: OrgNode[];
}
```

**API Endpoints:**
- `GET /api/admin/organization-tree` (New)
- `GET /api/admin/hierarchy/:userId` (New - Get sub-tree)

#### 4.3 Comprehensive Student Detail View
**Location:** `/management/admin/student/:id` or `/management/instructor/student/:id`

**Tabs:**
1. **Overview**
   - Profile photo, basic info
   - Current belt with visual badge
   - Membership status
   - Dojo assignment
   - Instructor assignment
   - Account creation date

2. **Belt History**
   - Timeline view (vertical line with dots)
   - Each promotion showing:
     - Date
     - Old belt → New belt
     - Promoted by (instructor name)
     - Notes
     - Time gap from previous
   - Visual chart of progression

3. **Training Sessions**
   - List of all training sessions attended
   - Attendance percentage
   - Training streak
   - Last attendance date
   - Monthly attendance chart

4. **Tournaments**
   - List of tournaments participated
   - Categories
   - Results/Placements
   - Matches fought (if available)
   - Win/Loss record

5. **Timeline**
   - Combined chronological view of:
     - Registration
     - Belt promotions
     - Tournament participations
     - Training milestones
     - Membership renewals
   - Filter by event type

**UI Features:**
- Print-friendly view
- Export to PDF
- Share link (admin/instructor only)
- Notes section (admin/instructor can add private notes)
- Activity log (who viewed, when)

**API Endpoints:**
- `GET /api/users/:id/full-profile` (New - includes everything)
- `GET /api/users/:id/timeline` (New)
- `POST /api/users/:id/notes` (New - Add private notes)

---

## 📊 DATABASE SCHEMA UPDATES

### New Models Needed

```prisma
// For instructor notes on students
model StudentNote {
  id            String   @id @default(uuid())
  studentId     String
  student       User     @relation("StudentNotes", fields: [studentId], references: [id])
  authorId      String
  author        User     @relation("AuthoredNotes", fields: [authorId], references: [id])
  content       String
  isPrivate     Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  
  @@index([studentId])
  @@index([authorId])
}

// For tracking who viewed profiles (audit trail)
model ProfileView {
  id         String   @id @default(uuid())
  viewerId   String
  viewer     User     @relation("Viewer", fields: [viewerId], references: [id])
  viewedId   String
  viewed     User     @relation("Viewed", fields: [viewedId], references: [id])
  viewedAt   DateTime @default(now())
  
  @@index([viewerId])
  @@index([viewedId])
}
```

### Existing Model Updates

```prisma
model User {
  // Add relations for new features
  studentNotes      StudentNote[]  @relation("StudentNotes")
  authoredNotes     StudentNote[]  @relation("AuthoredNotes")
  profileViewsGiven ProfileView[]  @relation("Viewer")
  profileViewsReceived ProfileView[] @relation("Viewed")
  
  // Make membership number unique
  membershipNumber  String?        @unique
}
```

---

## 🎨 UI/UX COMPONENTS TO BUILD

### Stage 3
1. **StudentListTable Component**
   - Sortable columns
   - Pagination
   - Filters panel
   - Bulk selection

2. **PromotionModal Component**
   - Student selector
   - Belt progression visual
   - Date picker
   - Notes textarea
   - Validation display

3. **EligibilityBadge Component**
   - Shows if student eligible for promotion
   - Countdown to eligibility
   - Color-coded (green/yellow/red)

### Stage 4
1. **SearchBar Component**
   - Autocomplete
   - Recent searches
   - Voice search (future)

2. **OrganizationTree Component**
   - Interactive SVG/Canvas
   - Zoom controls
   - Node detail popover

3. **TimelineView Component**
   - Vertical timeline
   - Event cards
   - Filter controls

4. **StudentProfileCard Component**
   - Compact view for search results
   - Quick actions
   - Hover preview

---

## 🔒 SECURITY & AUTHORIZATION

### Route Protection
- All `/management/instructor/*` routes → INSTRUCTOR + ADMIN only
- All `/management/admin/*` routes → ADMIN only
- Profile views logged for audit trail
- Instructors can only see their assigned students
- Admins can see all users

### Data Access Rules
```typescript
// Instructor access
- Can view: Own students only
- Can promote: Own students (below their rank)
- Can edit: Own profile + student assignments

// Admin access
- Can view: All users
- Can promote: Anyone (no rank restriction)
- Can edit: Everything
- Can delete: Users (soft delete)
```

---

## 📅 IMPLEMENTATION TIMELINE

### Day 1 (November 27)
**Morning (4 hours)**
- ✅ Fix authentication guards on all protected pages
- [ ] Database migrations for StudentNote and ProfileView
- [ ] Backend: Eligible students endpoint
- [ ] Backend: Organization tree endpoint

**Afternoon (4 hours)**
- [ ] Frontend: Students List tab UI
- [ ] Frontend: Promotion modal component
- [ ] Backend: Enhanced promote endpoint with validation
- [ ] Testing: Promotion workflow

### Day 2 (November 28)
**Morning (4 hours)**
- [ ] Backend: Global search endpoint with filters
- [ ] Frontend: Admin search interface
- [ ] Backend: Full profile endpoint with timeline
- [ ] Frontend: Organization chart component

**Afternoon (4 hours)**
- [ ] Frontend: Comprehensive student detail view
- [ ] Frontend: Timeline component
- [ ] Testing: Search and detail views
- [ ] Deployment and final testing

---

## 🧪 TESTING CHECKLIST

### Stage 3
- [ ] Instructor can view only their students
- [ ] Promotion respects 6-month rule
- [ ] Cannot promote to equal/higher rank
- [ ] Cannot skip belt levels
- [ ] Belt history shows correct dates
- [ ] Eligible students highlighted correctly
- [ ] Bulk promotion works

### Stage 4
- [ ] Search finds users by name/ID/email
- [ ] Filters work correctly
- [ ] Organization chart displays full hierarchy
- [ ] Student detail view shows all data
- [ ] Timeline sorted chronologically
- [ ] Profile views logged correctly
- [ ] Admin can see all, instructor sees subset

---

## 🚀 DEPLOYMENT STRATEGY

1. **Stage 3 Deployment**
   - Deploy backend migrations first
   - Deploy backend API updates
   - Deploy frontend instructor panel
   - Test promotion workflow end-to-end

2. **Stage 4 Deployment**
   - Deploy search and org chart together
   - Deploy student detail view
   - Run full regression testing

---

## 📝 NOTES & DECISIONS

### Deferred Features (Future Enhancements)
- Full tournament bracket system
- Advanced analytics dashboard
- SMS/Email notifications
- Mobile app
- Video training logs
- Sparring match records
- Attendance QR code scanning

### Technical Debt to Address
- Replace `any` types with proper TypeScript interfaces
- Add comprehensive error handling
- Implement loading states consistently
- Add optimistic UI updates
- Improve mobile responsiveness

### Performance Optimizations
- Implement pagination for large lists
- Add caching for frequently accessed data
- Lazy load organization chart nodes
- Debounce search queries
- Use React Query for data fetching

---

## 🎯 SUCCESS CRITERIA

### Stage 3 Complete When:
- ✅ Instructors can view all their students in organized list
- ✅ Promotion modal validates all business rules
- ✅ Belt history accurate with backdated entries
- ✅ Eligible students clearly identified
- ✅ All promotions logged correctly

### Stage 4 Complete When:
- ✅ Admin can search users by any field
- ✅ Organization chart displays full hierarchy
- ✅ Student detail view shows complete history
- ✅ Timeline combines all events chronologically
- ✅ Access control working perfectly

---

## 📞 TOMORROW'S FOCUS

**Primary Goal:** Complete Stage 3 - Instructor Promotion Interface

**Key Deliverables:**
1. Fix all authentication guards (DONE TODAY ✅)
2. Students list with eligibility indicators
3. Promotion modal with validation
4. Backend promotion logic enhancement
5. Testing and deployment

**Questions to Resolve:**
- Should we allow backdating beyond 1 year?
- Bulk promotion limit (max how many at once)?
- What happens to rejected verification requests?
- Should we show pending verification count on instructor dashboard?

---

**End of Plan Document**
