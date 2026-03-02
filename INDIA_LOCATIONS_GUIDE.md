# India Cities and States Data - Complete Guide

## Overview

This document provides information about the comprehensive Indian cities and states data that has been integrated into the Kyokushin Karate application.

## What's Included

### All 28 States

1. Andhra Pradesh
2. Arunachal Pradesh
3. Assam
4. Bihar
5. Chhattisgarh
6. Goa
7. Gujarat
8. Haryana
9. Himachal Pradesh
10. Jharkhand
11. Karnataka
12. Kerala
13. Madhya Pradesh
14. Maharashtra
15. Manipur
16. Meghalaya
17. Mizoram
18. Nagaland
19. Odisha
20. Punjab
21. Rajasthan
22. Sikkim
23. Tamil Nadu
24. Telangana
25. Tripura
26. Uttar Pradesh
27. Uttarakhand
28. West Bengal

### All 8 Union Territories

1. Andaman and Nicobar Islands
2. Chandigarh
3. Dadra and Nagar Haveli and Daman and Diu
4. Lakshadweep
5. Delhi
6. Puducherry
7. Ladakh
8. Jammu and Kashmir

## Data Files

### Frontend

- **Location**: `/frontend/src/lib/constants.ts`
- **Export**: `CITIES` (Record<string, string[]>)
- **Contains**: All states mapped to their cities
- **Usage**: Used in DojoManager, UserManagementTable, and RegisterPage

### Frontend Library

- **Location**: `/frontend/src/lib/india-locations.ts`
- **Exports**:
  - `INDIAN_STATES` - Array of all state objects with cities
  - `getAllStates()` - Returns sorted list of all states
  - `getCitiesByState(stateName)` - Returns cities for a specific state
  - `getAllCities()` - Returns all cities with their states
  - `searchCities(query)` - Search functionality for cities
  - `formatLocation(city, state)` - Format location string
  - `isCityInState(city, state)` - Validate city-state combination

### Backend

- **Location**: `/backend/src/utils/india-locations.ts`
- **Same exports as Frontend Library**
- **Can be used for backend validations and API responses**

## Components Using This Data

### 1. DojoManager (`frontend/src/components/dashboard/DojoManager.tsx`)

- Uses: `INDIAN_STATES`, `CITIES`
- Features:
  - State selection dropdown
  - City selection dropdown (dynamically populated based on selected state)
  - Create and edit dojo functionality

### 2. UserManagementTable (`frontend/src/components/dashboard/UserManagementTable.tsx`)

- Uses: `INDIAN_STATES`, `CITIES`
- Features:
  - User location selection
  - State and city dropdowns for user profiles

### 3. RegisterPage (`frontend/src/app/register/page.tsx`)

- Uses: `INDIAN_STATES`, `CITIES`
- Features:
  - Student registration with location
  - Dojo selection based on city
  - Automatic instructor assignment based on dojo

## Data Structure

### Format in constants.ts

```typescript
export const CITIES: Record<string, string[]> = {
    "State Name": ["City 1", "City 2", "City 3", ...],
    ...
}
```

### Format in india-locations.ts

```typescript
interface StateData {
  name: string;
  cities: string[];
}

interface CityData {
  name: string;
  state: string;
}
```

## Example Usage

### Frontend (React)

#### Get all states

```typescript
import { INDIAN_STATES } from "@/lib/constants";

INDIAN_STATES.map(state => <option value={state}>{state}</option>)
```

#### Get cities for a state

```typescript
import { CITIES } from "@/lib/constants";

const cities = CITIES[selectedState] || [];
cities.map(city => <option value={city}>{city}</option>)
```

#### Using the library functions

```typescript
import {
  getAllStates,
  getCitiesByState,
  searchCities,
  formatLocation,
  isCityInState,
} from "@/lib/india-locations";

// Get all states
const states = getAllStates();

// Get cities for Maharashtra
const maharashtraCities = getCitiesByState("Maharashtra");

// Search for cities
const results = searchCities("Mumbai");

// Validate city-state combination
const isValid = isCityInState("Mumbai", "Maharashtra");

// Format location string
const location = formatLocation("Mumbai", "Maharashtra");
```

### Backend (Node.js/TypeScript)

```typescript
import {
  getAllStates,
  getCitiesByState,
  INDIAN_STATES,
} from "@/utils/india-locations";

// Validate dojo creation
const isValidState = getAllStates().includes(dojoState);
const isValidCity = getCitiesByState(dojoState).includes(dojoCity);

// Send location data in API response
const states = getAllStates();
const cities = getCitiesByState(dojoState);
```

## Statistics

- **Total States/UTs**: 36
- **Total Cities**: 500+
- **Average Cities per State**: 14

## Database Considerations

The database schema for Dojo already supports city and state storage:

```prisma
model Dojo {
    id        String   @id @default(uuid())
    name      String
    dojoCode  String   @unique
    city      String
    state     String?
    country   String?
    address   String?
    ...
}
```

## Migration Notes

- All existing dojo data remains unchanged
- The application now validates cities against the comprehensive state-city mapping
- New dojos must select from predefined cities in the system

## Future Enhancements

Potential improvements:

1. Add coordinates (latitude/longitude) for cities for map integration
2. Add populations and regions
3. Add pincode ranges for postal services
4. Add district information for administrative purposes
5. Create city search autocomplete with filtering
6. Add city alias handling (e.g., "Bangalore" = "Bengaluru")

## References

- Data source: Government of India administrative divisions
- Based on current state and union territory classifications
- Compatible with Indian postal codes (PINCODEs)
- Complies with current administrative boundaries as of 2026

## Notes

- All city names follow the official Government of India guidelines
- Proper spellings (e.g., Kolkata, not Calcutta)
- Modern state names (e.g., Tamil Nadu, not Tamilnadu)
- Includes both traditional and new states (Ladakh, Telangana)
- Union Territories included in the same list for simple integration

## Support

For adding new cities or updating information:

1. Update both `/frontend/src/lib/india-locations.ts` and `/backend/src/utils/india-locations.ts`
2. Update `/frontend/src/lib/constants.ts` CITIES object
3. Test in all affected components (DojoManager, UserManagementTable, RegisterPage)
