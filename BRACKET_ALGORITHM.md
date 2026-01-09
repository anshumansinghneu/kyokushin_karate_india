# Tournament Bracket Seeding Algorithm

This document explains the bracket generation and seeding logic used in the Kyokushin Karate Tournament System.

## Overview

The system implements a **single-elimination tournament** with intelligent seeding based on:

1. **Belt Rank** (primary factor)
2. **Experience Level** (secondary factor)
3. **Standard bracket pairing** (1 vs lowest, 2 vs 2nd lowest, etc.)

## Bracket Generation Process

### 1. Category Grouping

Participants are grouped into categories based on:

- **Age Range**: 18-25, 26-35, 36-45, 46-55, Open
- **Weight Class**: Under 65kg, Under 75kg, Under 85kg, Over 85kg, Open
- **Belt Level**: White-Yellow, Brown-Black, Open

Example category: `"26-35, Under 75kg, Open"`

### 2. Seeding Algorithm

#### Belt Rank Values (Descending Order)

```typescript
{
    'Black 3rd Dan': 9,
    'Black 2nd Dan': 8,
    'Black 1st Dan': 7,
    'Black': 7,
    'Brown': 6,
    'Green': 5,
    'Yellow': 4,
    'Blue': 3,
    'Orange': 2,
    'White': 1
}
```

#### Seeding Process

1. **Sort participants** by belt rank (highest to lowest)
2. **Seed #1**: Highest belt rank → **Top of bracket**
3. **Seed #2**: 2nd highest → **Bottom of bracket**
4. **Seed #3-4**: Next two → **Middle positions**
5. Continue standard pairing pattern

### 3. Standard Bracket Pairing (8-Fighter Example)

```
Seed #1  ─┐
           ├─ Match 1
Seed #8  ─┘            ┐
                        ├─ Semifinal 1
Seed #4  ─┐            │
           ├─ Match 2  ┘
Seed #5  ─┘                        ┐
                                    ├─ Final
Seed #2  ─┐                        │
           ├─ Match 3              │
Seed #7  ─┘            ┐           │
                        ├─ Semifinal 2
Seed #3  ─┐            │
           ├─ Match 4  ┘
Seed #6  ─┘
```

**Pairing Logic**: `1v8, 2v7, 3v6, 4v5`

This ensures:

- Top two seeds cannot meet until final
- Top four seeds cannot meet until semifinals
- Stronger fighters distributed across bracket halves

### 4. Bye Handling

When participant count is **not a power of 2** (2, 4, 8, 16, 32, etc.):

#### Example: 6 Participants → 8-Person Bracket

```
Seed #1  ─── BYE (auto-advances)
                                ┐
Seed #4  ─┐                     ├─ Semifinal 1
           ├─ Match 1           │
Seed #5  ─┘                     │
                                             ┐
Seed #2  ─── BYE (auto-advances)            ├─ Final
                                ┐            │
Seed #3  ─┐                     ├─ Semifinal 2
           ├─ Match 2           │
Seed #6  ─┘                     │
```

**Bye Assignment Rules**:

- Top seeds (highest belt ranks) receive byes
- Byes auto-advance to Round 2
- Number of byes = `bracketSize - actualParticipants`
- Example: 6 fighters → 8-bracket → 2 byes (Seed #1 and #2)

### 5. Round Naming Convention

| Participants | Rounds                                                       |
| ------------ | ------------------------------------------------------------ |
| 2            | Final                                                        |
| 4            | Semi Finals, Final                                           |
| 8            | Quarter Finals, Semi Finals, Final                           |
| 16           | Round of 16, Quarter Finals, Semi Finals, Final              |
| 32           | Round of 32, Round of 16, Quarter Finals, Semi Finals, Final |

**Implementation**:

```typescript
const totalRounds = Math.log2(bracketSize);
if (roundNumber === totalRounds) return "Final";
if (roundNumber === totalRounds - 1) return "Semi Finals";
if (roundNumber === totalRounds - 2) return "Quarter Finals";
return `Round ${roundNumber}`;
```

## Advanced Seeding Strategies

### Current Implementation

✅ **Belt-based seeding** (implemented)

- Primary factor: Belt rank
- Ensures skill-appropriate matchups
- Reduces mismatches in early rounds

### Potential Enhancements

#### 1. Experience-Based Seeding

```typescript
// Could add years of experience as tiebreaker
if (beltA === beltB) {
  return (b.yearsOfExperience || 0) - (a.yearsOfExperience || 0);
}
```

#### 2. Geographic Distribution

```typescript
// Avoid same-dojo matchups in early rounds
if (beltA === beltB && experienceA === experienceB) {
  if (a.dojo.id === b.dojo.id) return 1; // Push same dojo apart
}
```

#### 3. Tournament History Seeding

```typescript
// Use past tournament performance
const winRateA = a.tournamentsWon / a.tournamentsParticipated;
const winRateB = b.tournamentsWon / b.tournamentsParticipated;
return winRateB - winRateA;
```

#### 4. Swiss-System Seeding (Alternative)

For larger tournaments, consider Swiss-system first rounds:

- Everyone plays same number of rounds
- Matchups based on current record
- Top performers advance to knockout

## Match Status Flow

```
SCHEDULED → LIVE → COMPLETED
     ↓
    BYE (auto-skip)
```

### Status Descriptions

- **SCHEDULED**: Match not yet started, waiting for time slot
- **LIVE**: Match currently in progress, scores being updated
- **COMPLETED**: Match finished, winner determined, advances to next round
- **BYE**: No opponent, fighter auto-advances

## Winner Advancement Logic

```typescript
// When match is COMPLETED:
1. Determine winner (highest score)
2. Find next round match
3. Calculate position in next match
4. Update next match with winner's ID
5. If next match has both fighters, set status to SCHEDULED
```

### Example Flow (8-Fighter Bracket)

```
Match 1 Winner → Semi Finals Match 1 (FighterA)
Match 2 Winner → Semi Finals Match 1 (FighterB)
Match 3 Winner → Semi Finals Match 2 (FighterA)
Match 4 Winner → Semi Finals Match 2 (FighterB)

Semi Final 1 Winner → Final (FighterA)
Semi Final 2 Winner → Final (FighterB)
```

## Third Place Determination

### Current Method (Semi-Final Losers)

```
Final:    Winner vs Winner
3rd Place: Both semi-final losers
```

Both semi-final losers are awarded 3rd place (no playoff match).

### Alternative: Third Place Match (Can be implemented)

```typescript
// Create actual 3rd place match
const thirdPlaceMatch = await prisma.match.create({
  data: {
    bracketId,
    roundNumber: finalRound,
    matchNumber: 2, // After final
    fighterAId: semifinalLoser1,
    fighterBId: semifinalLoser2,
    status: "SCHEDULED",
  },
});
```

## Real-World Examples

### Scenario 1: Perfect Power of 2 (8 Fighters)

- **Participants**: 8 fighters
- **Bracket Size**: 8 (no byes needed)
- **Rounds**: 3 (Quarter Finals, Semi Finals, Final)
- **Total Matches**: 7 (4 + 2 + 1)

### Scenario 2: Non-Power of 2 (6 Fighters)

- **Participants**: 6 fighters
- **Bracket Size**: 8 (next power of 2)
- **Byes**: 2 (top 2 seeds)
- **Round 1 Matches**: 2 (only unseeded fighters)
- **Total Matches**: 5 (2 + 2 + 1)

### Scenario 3: Large Tournament (32 Fighters)

- **Participants**: 32 fighters
- **Bracket Size**: 32 (perfect fit)
- **Rounds**: 5 (R32, R16, QF, SF, Final)
- **Total Matches**: 31 (16 + 8 + 4 + 2 + 1)

## Best Practices

### For Fair Tournaments

1. ✅ **Seed by skill level** (belt rank, experience)
2. ✅ **Use power-of-2 brackets** for clean progression
3. ✅ **Give byes to top seeds** to reward qualification performance
4. ✅ **Balance bracket halves** to avoid concentration of strong fighters
5. ✅ **Consider geographic diversity** in early rounds (same dojo)

### For Spectator Experience

1. ✅ **Clear round naming** (Semi Finals vs "Round 2")
2. ✅ **Match numbering** for easy reference
3. ✅ **Real-time updates** via WebSocket
4. ✅ **Visual bracket tree** for progression tracking

### For Competitive Integrity

1. ✅ **Transparent seeding criteria** (published before tournament)
2. ✅ **Consistent application** across all categories
3. ✅ **Minimal manual intervention** (automated seeding)
4. ✅ **Audit trail** of match results and progression

## References

Based on:

- **Wikipedia**: [Single-elimination tournament](https://en.wikipedia.org/wiki/Single-elimination_tournament)
- **NCAA March Madness** seeding system
- **UFC/Boxing** championship bracket structures
- **Kyokushin World Tournament** traditional formats

## Implementation Files

- **Seeding Logic**: `backend/src/services/tournamentService.ts`
- **Belt Rank Values**: `BELT_RANKS` constant
- **Match Creation**: `generateBrackets()` method
- **Winner Advancement**: `updateScore()` in `matchController.ts`

---

**Last Updated**: November 26, 2025
**Version**: 2.0.0 (Enhanced with age/weight distribution)
