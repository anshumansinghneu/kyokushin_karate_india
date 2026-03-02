// =============================================================================
// Single source of truth for Indian States, Union Territories and their Cities
// Data sourced from Encyclopædia Britannica
// https://www.britannica.com/topic/list-of-cities-and-towns-in-India-2033033
// =============================================================================

export interface StateData {
  name: string;
  type: "state" | "union_territory";
  cities: string[];
}

export interface CityData {
  city: string;
  state: string;
}

/**
 * All 28 Indian States + 8 Union Territories with their cities
 * (sourced from Britannica, supplemented with commonly-known additional cities)
 */
export const INDIAN_STATES_DATA: StateData[] = [
  // ─── STATES ──────────────────────────────────────────────────────────
  {
    name: "Andhra Pradesh",
    type: "state",
    cities: [
      "Adoni", "Amaravati", "Anantapur", "Chandragiri", "Chittoor",
      "Dowlaiswaram", "Eluru", "Guntur", "Kadapa", "Kakinada",
      "Kurnool", "Machilipatnam", "Nagarjunakonda", "Nellore",
      "Ongole", "Rajahmundry", "Srikakulam", "Tirupati",
      "Vijayawada", "Visakhapatnam", "Vizianagaram", "Yemmiganur"
    ],
  },
  {
    name: "Arunachal Pradesh",
    type: "state",
    cities: [
      "Itanagar", "Naharlagun", "Pasighat", "Tezu", "Ziro",
      "Bomdila", "Seppa", "Khonsa", "Daporijo", "Roing"
    ],
  },
  {
    name: "Assam",
    type: "state",
    cities: [
      "Dhuburi", "Dibrugarh", "Dispur", "Guwahati", "Jorhat",
      "Nagaon", "Sivasagar", "Silchar", "Tezpur", "Tinsukia",
      "Barpeta", "Golaghat", "Bongaigaon", "Kokrajhar"
    ],
  },
  {
    name: "Bihar",
    type: "state",
    cities: [
      "Ara", "Barauni", "Begusarai", "Bettiah", "Bhagalpur",
      "Bihar Sharif", "Bodh Gaya", "Buxar", "Chapra", "Darbhanga",
      "Dehri", "Dinapur Nizamat", "Gaya", "Hajipur",
      "Jamalpur", "Katihar", "Madhubani", "Motihari",
      "Munger", "Muzaffarpur", "Patna", "Purnia",
      "Pusa", "Saharsa", "Samastipur", "Sasaram",
      "Sitamarhi", "Siwan"
    ],
  },
  {
    name: "Chhattisgarh",
    type: "state",
    cities: [
      "Ambikapur", "Bhilai", "Bilaspur", "Dhamtari", "Durg",
      "Jagdalpur", "Korba", "Raipur", "Raigarh", "Rajnandgaon"
    ],
  },
  {
    name: "Goa",
    type: "state",
    cities: [
      "Madgaon", "Panaji", "Vasco da Gama", "Ponda",
      "Bicholim", "Pernem", "Sanquelim"
    ],
  },
  {
    name: "Gujarat",
    type: "state",
    cities: [
      "Ahmedabad", "Amreli", "Anand", "Bharuch", "Bhavnagar",
      "Bhuj", "Dwarka", "Gandhinagar", "Godhra", "Jamnagar",
      "Junagadh", "Kandla", "Khambhat", "Kheda",
      "Mahesana", "Morbi", "Nadiad", "Navsari",
      "Okha", "Palanpur", "Patan", "Porbandar",
      "Rajkot", "Surat", "Surendranagar", "Vadodara",
      "Valsad", "Vapi", "Veraval"
    ],
  },
  {
    name: "Haryana",
    type: "state",
    cities: [
      "Ambala", "Bhiwani", "Faridabad", "Firozpur Jhirka",
      "Gurugram", "Hansi", "Hisar", "Jind",
      "Kaithal", "Karnal", "Kurukshetra", "Panipat",
      "Pehowa", "Rewari", "Rohtak", "Sirsa",
      "Sonipat", "Yamunanagar"
    ],
  },
  {
    name: "Himachal Pradesh",
    type: "state",
    cities: [
      "Bilaspur", "Chamba", "Dalhousie", "Dharamshala",
      "Hamirpur", "Kangra", "Kullu", "Mandi",
      "Nahan", "Palampur", "Shimla", "Solan", "Una"
    ],
  },
  {
    name: "Jharkhand",
    type: "state",
    cities: [
      "Bokaro", "Chaibasa", "Deoghar", "Dhanbad",
      "Dumka", "Giridih", "Hazaribag", "Jamshedpur",
      "Jharia", "Rajmahal", "Ramgarh", "Ranchi", "Saraikela"
    ],
  },
  {
    name: "Karnataka",
    type: "state",
    cities: [
      "Badami", "Ballari", "Belagavi", "Bengaluru",
      "Bhadravati", "Bidar", "Chikkamagaluru", "Chitradurga",
      "Davangere", "Halebid", "Hassan", "Hubballi-Dharwad",
      "Kalaburagi", "Kolar", "Madikeri", "Mandya",
      "Mangaluru", "Mysuru", "Raichur", "Shivamogga",
      "Shravanabelagola", "Shrirangapattana", "Tumakuru",
      "Udupi", "Vijayapura"
    ],
  },
  {
    name: "Kerala",
    type: "state",
    cities: [
      "Alappuzha", "Idukki", "Kannur", "Kochi",
      "Kollam", "Kottayam", "Kozhikode", "Malappuram",
      "Mattancheri", "Palakkad", "Pathanamthitta",
      "Thalassery", "Thiruvananthapuram", "Thrissur",
      "Vatakara", "Wayanad"
    ],
  },
  {
    name: "Madhya Pradesh",
    type: "state",
    cities: [
      "Balaghat", "Barwani", "Betul", "Bharhut",
      "Bhind", "Bhojpur", "Bhopal", "Burhanpur",
      "Chhatarpur", "Chhindwara", "Damoh", "Datia",
      "Dewas", "Dhar", "Guna", "Gwalior",
      "Hoshangabad", "Indore", "Itarsi", "Jabalpur",
      "Jhabua", "Khajuraho", "Khandwa", "Khargone",
      "Maheshwar", "Mandla", "Mandsaur", "Morena",
      "Murwara", "Narsimhapur", "Narsinghgarh", "Narwar",
      "Neemuch", "Nowgong", "Orchha", "Panna",
      "Raisen", "Rajgarh", "Ratlam", "Rewa",
      "Sagar", "Sarangpur", "Satna", "Sehore",
      "Seoni", "Shahdol", "Shajapur", "Sheopur",
      "Shivpuri", "Ujjain", "Vidisha"
    ],
  },
  {
    name: "Maharashtra",
    type: "state",
    cities: [
      "Ahmadnagar", "Akola", "Amravati", "Aurangabad",
      "Bhandara", "Bhusawal", "Bid", "Buldhana",
      "Chandrapur", "Daulatabad", "Dhule", "Jalgaon",
      "Kalyan", "Karli", "Kolhapur", "Mahabaleshwar",
      "Malegaon", "Matheran", "Mumbai", "Nagpur",
      "Nanded", "Nashik", "Osmanabad", "Pandharpur",
      "Parbhani", "Pune", "Ratnagiri", "Sangli",
      "Satara", "Sevagram", "Solapur", "Thane",
      "Ulhasnagar", "Vasai-Virar", "Wardha", "Yavatmal",
      "Latur", "Navi Mumbai"
    ],
  },
  {
    name: "Manipur",
    type: "state",
    cities: [
      "Imphal", "Thoubal", "Bishnupur", "Kakching",
      "Ukhrul", "Tamenglong", "Senapati", "Churachandpur"
    ],
  },
  {
    name: "Meghalaya",
    type: "state",
    cities: [
      "Cherrapunji", "Shillong", "Tura", "Jowai",
      "Nongpoh", "Baghmara"
    ],
  },
  {
    name: "Mizoram",
    type: "state",
    cities: [
      "Aizawl", "Lunglei", "Saiha", "Lawngtlai",
      "Champhai", "Serchhip", "Kolasib"
    ],
  },
  {
    name: "Nagaland",
    type: "state",
    cities: [
      "Dimapur", "Kohima", "Mokokchung", "Mon",
      "Phek", "Tuensang", "Wokha", "Zunheboto",
      "Peren", "Longleng"
    ],
  },
  {
    name: "Odisha",
    type: "state",
    cities: [
      "Balangir", "Baleshwar", "Baripada", "Bhubaneswar",
      "Brahmapur", "Cuttack", "Dhenkanal", "Kendujhar",
      "Konark", "Koraput", "Paradip", "Phulabani",
      "Puri", "Rourkela", "Sambalpur", "Udayagiri",
      "Angul", "Jharsuguda"
    ],
  },
  {
    name: "Punjab",
    type: "state",
    cities: [
      "Amritsar", "Batala", "Bathinda", "Faridkot",
      "Firozpur", "Gurdaspur", "Hoshiarpur", "Jalandhar",
      "Kapurthala", "Ludhiana", "Mohali", "Nabha",
      "Patiala", "Rupnagar", "Sangrur"
    ],
  },
  {
    name: "Rajasthan",
    type: "state",
    cities: [
      "Abu", "Ajmer", "Alwar", "Amer", "Banswara",
      "Barmer", "Beawar", "Bharatpur", "Bhilwara",
      "Bikaner", "Bundi", "Chittaurgarh", "Churu",
      "Dhaulpur", "Dungarpur", "Ganganagar", "Hanumangarh",
      "Jaipur", "Jaisalmer", "Jalor", "Jhalawar",
      "Jhunjhunu", "Jodhpur", "Kishangarh", "Kota",
      "Merta", "Nagaur", "Nathdwara", "Pali",
      "Phalodi", "Pushkar", "Sawai Madhopur", "Shahpura",
      "Sikar", "Sirohi", "Tonk", "Udaipur"
    ],
  },
  {
    name: "Sikkim",
    type: "state",
    cities: [
      "Gangtok", "Gyalshing", "Lachung", "Mangan",
      "Namchi", "Pelling", "Ravangla"
    ],
  },
  {
    name: "Tamil Nadu",
    type: "state",
    cities: [
      "Arcot", "Chengalpattu", "Chennai", "Chidambaram",
      "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul",
      "Erode", "Kanchipuram", "Kanniyakumari", "Kodaikanal",
      "Kumbakonam", "Madurai", "Mamallapuram", "Nagappattinam",
      "Nagercoil", "Palayamkottai", "Pudukkottai", "Rajapalayam",
      "Ramanathapuram", "Salem", "Thanjavur", "Tiruchchirappalli",
      "Tirunelveli", "Tiruppur", "Thoothukudi",
      "Udhagamandalam", "Vellore"
    ],
  },
  {
    name: "Telangana",
    type: "state",
    cities: [
      "Hyderabad", "Karimnagar", "Khammam", "Mahbubnagar",
      "Nizamabad", "Sangareddi", "Warangal",
      "Ramagundam", "Suryapet", "Medchal"
    ],
  },
  {
    name: "Tripura",
    type: "state",
    cities: [
      "Agartala", "Dharmanagar", "Kailashahar",
      "Ambassa", "Khowai", "Udaipur"
    ],
  },
  {
    name: "Uttar Pradesh",
    type: "state",
    cities: [
      "Agra", "Aligarh", "Amroha", "Ayodhya",
      "Azamgarh", "Bahraich", "Ballia", "Banda",
      "Bara Banki", "Bareilly", "Basti", "Bijnor",
      "Bithur", "Budaun", "Bulandshahr", "Deoria",
      "Etah", "Etawah", "Faizabad", "Farrukhabad-cum-Fatehgarh",
      "Fatehpur", "Fatehpur Sikri", "Firozabad", "Ghaziabad",
      "Ghazipur", "Gonda", "Gorakhpur", "Greater Noida",
      "Hamirpur", "Hardoi", "Hathras", "Jalaun",
      "Jaunpur", "Jhansi", "Kannauj", "Kanpur",
      "Lakhimpur", "Lalitpur", "Lucknow", "Mainpuri",
      "Mathura", "Meerut", "Mirzapur-Vindhyachal", "Moradabad",
      "Muzaffarnagar", "Noida", "Orai", "Partapgarh",
      "Pilibhit", "Prayagraj", "Rae Bareli", "Rampur",
      "Saharanpur", "Sambhal", "Shahjahanpur", "Sitapur",
      "Sultanpur", "Varanasi"
    ],
  },
  {
    name: "Uttarakhand",
    type: "state",
    cities: [
      "Almora", "Dehradun", "Haridwar", "Mussoorie",
      "Nainital", "Pithoragarh", "Rudraprayag",
      "Uttarkashi", "Pauri", "Chamoli"
    ],
  },
  {
    name: "West Bengal",
    type: "state",
    cities: [
      "Alipore", "Alipur Duar", "Asansol", "Baharampur",
      "Bally", "Balurghat", "Bankura", "Baranagar",
      "Barasat", "Barrackpore", "Basirhat", "Bhatpara",
      "Bishnupur", "Budge Budge", "Burdwan", "Chandernagore",
      "Cooch Behar", "Darjeeling", "Diamond Harbour", "Dum Dum",
      "Durgapur", "Halisahar", "Haora", "Hooghly",
      "Howrah", "Ingraj Bazar", "Jalpaiguri", "Kalimpong",
      "Kamarhati", "Kanchrapara", "Kharagpur", "Kolkata",
      "Krishnanagar", "Malda", "Midnapore", "Murshidabad",
      "Nabadwip", "Palashi", "Panihati", "Purulia",
      "Raiganj", "Santipur", "Shantiniketan", "Shrirampur",
      "Siliguri", "Siuri", "Tamluk", "Titagarh"
    ],
  },

  // ─── UNION TERRITORIES ───────────────────────────────────────────────
  {
    name: "Andaman and Nicobar Islands",
    type: "union_territory",
    cities: [
      "Port Blair", "Car Nicobar", "Great Nicobar",
      "Little Andaman", "Rangat"
    ],
  },
  {
    name: "Chandigarh",
    type: "union_territory",
    cities: ["Chandigarh"],
  },
  {
    name: "Dadra and Nagar Haveli and Daman and Diu",
    type: "union_territory",
    cities: ["Daman", "Diu", "Silvassa"],
  },
  {
    name: "Delhi",
    type: "union_territory",
    cities: [
      "Delhi", "New Delhi"
    ],
  },
  {
    name: "Jammu and Kashmir",
    type: "union_territory",
    cities: [
      "Anantnag", "Baramula", "Doda", "Ganderbal",
      "Gulmarg", "Jammu", "Kathua", "Pulwama",
      "Punch", "Rajouri", "Shopian", "Srinagar", "Udhampur"
    ],
  },
  {
    name: "Ladakh",
    type: "union_territory",
    cities: ["Kargil", "Leh"],
  },
  {
    name: "Lakshadweep",
    type: "union_territory",
    cities: ["Kavaratti", "Agatti", "Androth", "Kiltan", "Kalpeni"],
  },
  {
    name: "Puducherry",
    type: "union_territory",
    cities: ["Karaikal", "Mahe", "Puducherry", "Yanam"],
  },
];

// ─── DERIVED EXPORTS ─────────────────────────────────────────────────────────

/** Sorted list of all state/UT names */
export const INDIAN_STATES: string[] = INDIAN_STATES_DATA
  .map((s) => s.name)
  .sort();

/** Map of state → cities  (Record<string, string[]>) */
export const CITIES: Record<string, string[]> = Object.fromEntries(
  INDIAN_STATES_DATA.map((s) => [s.name, [...s.cities].sort()])
);

// ─── HELPER FUNCTIONS ────────────────────────────────────────────────────────

/** Returns sorted list of all state/UT names */
export function getAllStates(): string[] {
  return INDIAN_STATES;
}

/** Returns sorted cities for a given state name. Empty array if not found. */
export function getCitiesByState(stateName: string): string[] {
  return CITIES[stateName] ?? [];
}

/** Returns a flat list of all cities with their states */
export function getAllCities(): CityData[] {
  return INDIAN_STATES_DATA.flatMap((s) =>
    s.cities.map((city) => ({ city, state: s.name }))
  );
}

/** Search cities across all states (case-insensitive prefix match) */
export function searchCities(query: string, limit = 20): CityData[] {
  if (!query || query.length < 1) return [];
  const q = query.toLowerCase();
  const results: CityData[] = [];
  for (const s of INDIAN_STATES_DATA) {
    for (const city of s.cities) {
      if (city.toLowerCase().startsWith(q)) {
        results.push({ city, state: s.name });
        if (results.length >= limit) return results;
      }
    }
  }
  return results;
}

/** Format "City, State" string */
export function formatLocation(city: string, state: string): string {
  return `${city}, ${state}`;
}

/** Check if a city belongs to a given state */
export function isCityInState(city: string, state: string): boolean {
  const cities = CITIES[state];
  if (!cities) return false;
  return cities.some((c) => c.toLowerCase() === city.toLowerCase());
}
