/**
 * Coordinates for cities with registered dojos, used when a dojo has no
 * latitude/longitude of its own. Shared by the dojo finder and the homepage.
 */
export const CITY_COORDS: Record<string, [number, number]> = {
  mumbai: [19.076, 72.8777],
  delhi: [28.6139, 77.209],
  'new delhi': [28.6139, 77.209],
  bangalore: [12.9716, 77.5946],
  bengaluru: [12.9716, 77.5946],
  chennai: [13.0827, 80.2707],
  kolkata: [22.5726, 88.3639],
  hyderabad: [17.385, 78.4867],
  pune: [18.5204, 73.8567],
  ahmedabad: [23.0225, 72.5714],
  jaipur: [26.9124, 75.7873],
  lucknow: [26.8467, 80.9462],
  chandigarh: [30.7333, 76.7794],
  bhopal: [23.2599, 77.4126],
  patna: [25.6093, 85.1376],
  guwahati: [26.1445, 91.7362],
  thiruvananthapuram: [8.5241, 76.9366],
  kochi: [9.9312, 76.2673],
  indore: [22.7196, 75.8577],
  nagpur: [21.1458, 79.0882],
  coimbatore: [11.0168, 76.9558],
  visakhapatnam: [17.6868, 83.2185],
  surat: [21.1702, 72.8311],
  vadodara: [22.3072, 73.1812],
  noida: [28.5355, 77.391],
  gurgaon: [28.4595, 77.0266],
  gurugram: [28.4595, 77.0266],
  shuklaganj: [26.4799, 80.2932],
  unnao: [26.5477, 80.4878],
  kanpur: [26.4499, 80.3319],
  varanasi: [25.3176, 82.9739],
  agra: [27.1767, 78.0081],
  prayagraj: [25.4358, 81.8463],
  gorakhpur: [26.7606, 83.3732],
  meerut: [28.9845, 77.7064],
  bareilly: [28.3670, 79.4304],
  dehradun: [30.3165, 78.0322],
  bhilai: [21.2094, 81.3784],
  amritsar: [31.6340, 74.8723],
  alipurduar: [26.4900, 89.5271],
  raipur: [21.2514, 81.6296],
  ludhiana: [30.9010, 75.8573],
  jalandhar: [31.3260, 75.5762],
  ranchi: [23.3441, 85.3096],
  bhubaneswar: [20.2961, 85.8245],
  gwalior: [26.2183, 78.1828],
  jodhpur: [26.2389, 73.0243],
  mysore: [12.2958, 76.6394],
  mangalore: [12.9141, 74.8560],
  jammu: [32.7266, 74.8570],
  srinagar: [34.0837, 74.7973],
  shimla: [31.1048, 77.1734],
  dharamsala: [32.2190, 76.3234],
  siliguri: [26.7271, 88.3953],
  imphal: [24.8170, 93.9368],
  shillong: [25.5788, 91.8933],
  dibrugarh: [27.4728, 94.9120],
  tezpur: [26.6528, 92.7926],
  // Cities that had registered dojos but no coordinates, so their pins never
  // rendered at all: Durg, Nainital (4 dojos) and Aurangabad.
  durg: [21.1904, 81.2849],
  nainital: [29.3803, 79.4636],
  haldwani: [29.2183, 79.5130],
  bhimtal: [29.3475, 79.5629],
  aurangabad: [19.8762, 75.3433],
};

/**
 * City names arrive with inconsistent spacing and punctuation ("Alipur Duar"
 * vs the `alipurduar` key), and a plain lowercase lookup missed them — the dojo
 * then silently rendered no pin. Collapse to alphanumerics on both sides.
 */
export const normalizeCity = (city?: string): string =>
  (city ?? '').toLowerCase().replace(/[^a-z0-9]/g, '');

export const CITY_INDEX: Record<string, [number, number]> = Object.fromEntries(
  Object.entries(CITY_COORDS).map(([k, v]) => [normalizeCity(k), v]),
);

