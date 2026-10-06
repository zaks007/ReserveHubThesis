import hotelDivinusAsset from "@/assets/hotel-divinus.png.asset.json";

export type InstitutionType = "hotel" | "university" | "sports" | "garden" | "airbnb";

export interface Coords {
  lat: number;
  lng: number;
}

export interface Institution {
  id: string;
  name: string;
  type: InstitutionType;
  city: string;
  description: string;
  image: string;
  rating: number;
  coords?: Coords;
  address?: string;
  campuses?: Campus[];
  buildings: Building[];
}

export interface Campus {
  id: string;
  name: string;
  coords?: Coords;
  address?: string;
  buildings: Building[];
}

export interface Building {
  id: string;
  name: string;
  coords?: Coords;
  address?: string;
  spaces: Space[];
}

export type PriceUnit = "hour" | "night" | "month";

export interface Space {
  id: string;
  name: string;
  capacity: number;
  image: string;
  features: string[];
  /** Price in HUF expressed per `priceUnit` (hour / night / month). Field kept as
   *  `pricePerHour` for backwards compatibility — read alongside `priceUnit`. */
  pricePerHour: number;
  priceUnit?: PriceUnit;
  available: boolean;
}

/** Default booking unit per institution type — used when a Space has no explicit unit. */
export const defaultPriceUnit: Record<InstitutionType, PriceUnit> = {
  hotel: "night",
  airbnb: "night",
  garden: "month",
  sports: "hour",
  university: "hour",
};

export const priceUnitLabel: Record<PriceUnit, string> = { hour: "hour", night: "night", month: "month" };
export const priceUnitShort: Record<PriceUnit, string> = { hour: "hr", night: "night", month: "mo" };

export interface Booking {
  id: string;
  spaceName: string;
  institutionName: string;
  buildingName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: "confirmed" | "pending" | "cancelled";
  capacity: number;
}

const hotelRooms: Space[] = [
  { id: "hr1", name: "Standard Double Room", capacity: 2, image: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=600", features: ["Queen Bed", "WiFi", "AC", "Private Bathroom", "TV"], pricePerHour: 28000, priceUnit: "night", available: true },
  { id: "hr2", name: "Deluxe King Room", capacity: 2, image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=600", features: ["King Bed", "WiFi", "AC", "Balcony", "Mini Bar", "TV"], pricePerHour: 42000, priceUnit: "night", available: true },
  { id: "hr3", name: "Twin Room", capacity: 2, image: "https://images.unsplash.com/photo-1566665797739-1674de7a421a?w=600", features: ["Two Single Beds", "WiFi", "AC", "TV"], pricePerHour: 25000, priceUnit: "night", available: true },
  { id: "hr4", name: "Family Room", capacity: 4, image: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=600", features: ["2 Queen Beds", "WiFi", "AC", "TV", "Extra Space"], pricePerHour: 52000, priceUnit: "night", available: true },
  { id: "hr5", name: "Junior Suite", capacity: 2, image: "https://images.unsplash.com/photo-1591088398332-8a7791972843?w=600", features: ["King Bed", "Lounge Area", "WiFi", "AC", "Mini Bar"], pricePerHour: 68000, priceUnit: "night", available: false },
];

const hotelFlats: Space[] = [
  { id: "hf1", name: "Studio Apartment", capacity: 2, image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600", features: ["Kitchenette", "WiFi", "AC", "Workspace", "Smart TV"], pricePerHour: 34000, priceUnit: "night", available: true },
  { id: "hf2", name: "One-Bedroom Flat", capacity: 3, image: "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600", features: ["Full Kitchen", "Living Room", "WiFi", "AC", "Washer"], pricePerHour: 52000, priceUnit: "night", available: true },
  { id: "hf3", name: "Two-Bedroom Flat", capacity: 5, image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600", features: ["Full Kitchen", "Living Room", "2 Bathrooms", "WiFi", "Washer"], pricePerHour: 78000, priceUnit: "night", available: true },
  { id: "hf4", name: "Penthouse Suite", capacity: 4, image: "https://images.unsplash.com/photo-1590490360182-c33d57733427?w=600", features: ["Terrace", "Full Kitchen", "Jacuzzi", "WiFi", "Panoramic View"], pricePerHour: 135000, priceUnit: "night", available: true },
];

const uniSpaces: Space[] = [
  { id: "u-lh1", name: "Lecture Hall 101", capacity: 120, image: "https://images.unsplash.com/photo-1580582932707-520aed937b7b?w=600", features: ["Projector", "WiFi", "Microphone", "AC", "Recording", "Tiered Seating"], pricePerHour: 0, priceUnit: "hour", available: true },
  { id: "u-lh2", name: "Lecture Hall 202 — Auditorium", capacity: 220, image: "https://images.unsplash.com/photo-1559223607-a43c990c692c?w=600", features: ["Projector", "WiFi", "Microphone", "AC", "Recording", "Stage"], pricePerHour: 0, priceUnit: "hour", available: true },
  { id: "u-lh3", name: "Lecture Hall A-15", capacity: 80, image: "https://images.unsplash.com/photo-1571260899304-425eee4c7efc?w=600", features: ["Projector", "WiFi", "Microphone", "AC"], pricePerHour: 0, priceUnit: "hour", available: false },
  { id: "u-sr1", name: "Seminar Room 305", capacity: 30, image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=600", features: ["WiFi", "Projector", "Whiteboard", "AC"], pricePerHour: 0, priceUnit: "hour", available: true },
  { id: "u-sr2", name: "Seminar Room 202", capacity: 25, image: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=600", features: ["WiFi", "Projector", "Whiteboard"], pricePerHour: 0, priceUnit: "hour", available: true },
  { id: "u-sr3", name: "Seminar Room 110", capacity: 28, image: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600", features: ["WiFi", "Smart Board", "AC"], pricePerHour: 0, priceUnit: "hour", available: true },
  { id: "u-sr4", name: "Seminar Room B-4", capacity: 22, image: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600", features: ["WiFi", "Projector", "Whiteboard", "Movable Tables"], pricePerHour: 0, priceUnit: "hour", available: true },
  { id: "u-sr5", name: "Seminar Room L-2 (Library)", capacity: 18, image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=600", features: ["WiFi", "Whiteboard", "Quiet Zone"], pricePerHour: 0, priceUnit: "hour", available: true },
  { id: "u-sr6", name: "Seminar Room M-7 (Medical)", capacity: 24, image: "https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?w=600", features: ["WiFi", "Projector", "Anatomical Models", "AC"], pricePerHour: 0, priceUnit: "hour", available: true },
];


const sportsSpaces: Space[] = [
  { id: "sp1", name: "Agrár Football Pitch", capacity: 22, image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=600", features: ["Full-size grass pitch", "Floodlights", "Changing rooms", "Showers", "Parking"], pricePerHour: 12000, priceUnit: "hour", available: true },
  { id: "sp2", name: "G4 Football Pitch", capacity: 14, image: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=600", features: ["Artificial turf", "5-a-side", "Floodlights", "Changing rooms"], pricePerHour: 8500, priceUnit: "hour", available: true },
  { id: "sp3", name: "West Hostel Football Pitch", capacity: 18, image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=600", features: ["Artificial turf", "7-a-side", "Floodlights", "Outdoor"], pricePerHour: 9500, priceUnit: "hour", available: true },
  { id: "sp4", name: "Main Basketball Court", capacity: 20, image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=600", features: ["Full court", "Indoor", "Changing rooms", "Scoreboard", "Spectator seating"], pricePerHour: 7500, priceUnit: "hour", available: true },
  { id: "sp5", name: "Indoor Training Court", capacity: 12, image: "https://images.unsplash.com/photo-1518614368389-d4f02c2c84e8?w=600", features: ["Half court", "Indoor", "Air conditioned", "Equipment included"], pricePerHour: 5500, priceUnit: "hour", available: true },
];

const gardenPlots: Space[] = [
  { id: "g1", name: "Plot A1 — Raised Bed", capacity: 1, image: "https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=600", features: ["Raised Bed", "Water Access", "Tool Shed", "Composting"], pricePerHour: 8000, priceUnit: "month", available: true },
  { id: "g2", name: "Plot A2 — Herb Garden", capacity: 1, image: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=600", features: ["Herb Section", "Water Access", "Sunlit"], pricePerHour: 6000, priceUnit: "month", available: true },
  { id: "g3", name: "Plot B1 — Large Family Plot", capacity: 4, image: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600", features: ["Large Area", "Water Access", "Tool Shed", "Greenhouse Access", "Composting"], pricePerHour: 14000, priceUnit: "month", available: true },
  { id: "g4", name: "Plot B2 — Starter Plot", capacity: 1, image: "https://images.unsplash.com/photo-1591857177580-dc82b9ac4e1e?w=600", features: ["Small Area", "Water Access", "Beginner Friendly"], pricePerHour: 4500, priceUnit: "month", available: true },
  { id: "g5", name: "Plot C1 — Flower Garden", capacity: 2, image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=600", features: ["Flower Beds", "Water Access", "Decorative Area"], pricePerHour: 7000, priceUnit: "month", available: false },
  { id: "g6", name: "Community Greenhouse", capacity: 6, image: "https://images.unsplash.com/photo-1585255318859-f5c15f4cffe9?w=600", features: ["Heated", "Water System", "Seedling Trays", "Year-Round"], pricePerHour: 22000, priceUnit: "month", available: true },
];

const airbnbListings: Space[] = [
  { id: "ab1", name: "Cozy Loft near Nagytemplom", capacity: 2, image: "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=600", features: ["WiFi", "Kitchen", "Self Check-in", "City View"], pricePerHour: 19000, priceUnit: "night", available: true },
  { id: "ab2", name: "Modern Apartment in Downtown", capacity: 4, image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=600", features: ["WiFi", "Full Kitchen", "Washer", "Workspace", "Netflix"], pricePerHour: 29000, priceUnit: "night", available: true },
  { id: "ab3", name: "Charming Studio by the Park", capacity: 2, image: "https://images.unsplash.com/photo-1554995207-c18c203602cb?w=600", features: ["WiFi", "Kitchenette", "Garden Access", "Parking"], pricePerHour: 17000, priceUnit: "night", available: true },
  { id: "ab4", name: "Family House with Garden", capacity: 6, image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600", features: ["WiFi", "Full Kitchen", "Garden", "BBQ", "Parking", "Pet Friendly"], pricePerHour: 48000, priceUnit: "night", available: true },
  { id: "ab5", name: "Stylish Flat near University", capacity: 3, image: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600", features: ["WiFi", "Kitchen", "Workspace", "Washer"], pricePerHour: 23000, priceUnit: "night", available: false },
  { id: "ab6", name: "Luxury Penthouse Downtown", capacity: 4, image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600", features: ["Rooftop Terrace", "Full Kitchen", "WiFi", "Premium View"], pricePerHour: 72000, priceUnit: "night", available: true },
];

export const institutions: Institution[] = [
  {
    id: "inst-1",
    name: "Hotel Divinus Debrecen",
    type: "hotel",
    city: "Debrecen",
    description: "Elegant 5-star hotel in the Great Forest with spa, wellness and conference facilities.",
    image: hotelDivinusAsset.url,
    rating: 5,
    coords: { lat: 47.5598, lng: 21.6310 },
    address: "Nagyerdei körút 1, 4032 Debrecen",
    buildings: [
      { id: "b1", name: "Rooms", coords: { lat: 47.5316, lng: 21.6242 }, spaces: [hotelRooms[0], hotelRooms[1], hotelRooms[2], hotelRooms[3], hotelRooms[4]] },
      { id: "b2", name: "Flats & Suites", coords: { lat: 47.5316, lng: 21.6242 }, spaces: [hotelFlats[0], hotelFlats[1], hotelFlats[3]] },
    ],
  },
  {
    id: "inst-2",
    name: "University of Debrecen",
    type: "university",
    city: "Debrecen",
    description: "One of Hungary's largest universities with multiple campuses across the city.",
    image: "https://upload.wikimedia.org/wikipedia/commons/7/73/DebrecenDSCN3583.JPG",
    rating: 4.5,
    coords: { lat: 47.5536, lng: 21.6243 },
    address: "Egyetem tér 1, 4032 Debrecen",
    campuses: [
      {
        id: "c1",
        name: "Main Building (Egyetem tér)",
        coords: { lat: 47.5536, lng: 21.6243 },
        address: "Egyetem tér 1, 4032 Debrecen",
        buildings: [
          { id: "b5", name: "Main Building", coords: { lat: 47.5536, lng: 21.6243 }, address: "Egyetem tér 1", spaces: [uniSpaces[1], uniSpaces[3]] },
          { id: "b6", name: "Library & Study Center", coords: { lat: 47.5527, lng: 21.6253 }, address: "Egyetem tér 1", spaces: [uniSpaces[4], uniSpaces[7]] },
        ],
      },
      {
        id: "c2",
        name: "Kassai Campus",
        coords: { lat: 47.5418, lng: 21.6428 },
        address: "Kassai út 26, 4028 Debrecen",
        buildings: [
          { id: "b3", name: "Faculty of Informatics", coords: { lat: 47.5418, lng: 21.6428 }, address: "Kassai út 26", spaces: [uniSpaces[0], uniSpaces[3], uniSpaces[5]] },
        ],
      },
      {
        id: "c3",
        name: "Agrár Campus (Böszörményi)",
        coords: { lat: 47.5639, lng: 21.5994 },
        address: "Böszörményi út 138, 4032 Debrecen",
        buildings: [
          { id: "b7", name: "Faculty of Agriculture", coords: { lat: 47.5639, lng: 21.5994 }, address: "Böszörményi út 138", spaces: [uniSpaces[0], uniSpaces[8]] },
        ],
      },
      {
        id: "c4",
        name: "Ótemető Campus",
        coords: { lat: 47.5447, lng: 21.6512 },
        address: "Ótemető u. 2-4, 4028 Debrecen",
        buildings: [
          { id: "b4", name: "Faculty of Engineering", coords: { lat: 47.5447, lng: 21.6512 }, address: "Ótemető u. 2-4", spaces: [uniSpaces[2], uniSpaces[6]] },
        ],
      },
    ],

    buildings: [],
  },
  {
    id: "inst-3",
    name: "Agrár Sport Pitch",
    type: "sports",
    city: "Debrecen",
    description: "Full-size outdoor grass football pitch on the Agrár site — open to clubs, casual players and external bookings.",
    image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?w=900",
    rating: 4.6,
    coords: { lat: 47.5470, lng: 21.5993 },
    address: "Böszörményi út 138, 4032 Debrecen",
    buildings: [
      { id: "b8", name: "Outdoor Pitch", coords: { lat: 47.5470, lng: 21.5993 }, spaces: [sportsSpaces[0]] },
    ],
  },
  {
    id: "inst-9",
    name: "G4 Sport Arena",
    type: "sports",
    city: "Debrecen",
    description: "Compact 5-a-side artificial-turf pitch with floodlights — perfect for evening matches and small groups.",
    image: "https://images.unsplash.com/photo-1556056504-5c7696c4c28d?w=900",
    rating: 4.5,
    coords: { lat: 47.5398, lng: 21.6300 },
    address: "Kassai út 26, 4028 Debrecen",
    buildings: [
      { id: "b20", name: "Turf Pitch", coords: { lat: 47.5398, lng: 21.6300 }, spaces: [sportsSpaces[1]] },
    ],
  },
  {
    id: "inst-10",
    name: "West Hostel Sport Centre",
    type: "sports",
    city: "Debrecen",
    description: "Outdoor 7-a-side artificial pitch next to the West Hostel — available to the public year-round.",
    image: "https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=900",
    rating: 4.4,
    coords: { lat: 47.5469, lng: 21.6168 },
    address: "Egyetem sgrt. 7, 4032 Debrecen",
    buildings: [
      { id: "b21", name: "Turf Pitch", coords: { lat: 47.5469, lng: 21.6168 }, spaces: [sportsSpaces[2]] },
    ],
  },
  {
    id: "inst-5",
    name: "Aquaticum Thermal Hotel",
    type: "hotel",
    city: "Debrecen",
    description: "Spa and wellness hotel in the Great Forest with meeting rooms and event spaces.",
    image: "https://upload.wikimedia.org/wikipedia/commons/9/9c/Debreceni_Nagyerd%C5%91%2C_sportk%C3%B6zpont_a_magasb%C3%B3l.jpg",
    rating: 4.4,
    coords: { lat: 47.5614, lng: 21.6189 },
    address: "Nagyerdei krt. 9-11, 4032 Debrecen",
    buildings: [
      { id: "b11", name: "Rooms", coords: { lat: 47.5614, lng: 21.6189 }, spaces: [hotelRooms[1], hotelRooms[3], hotelRooms[2]] },
      { id: "b12", name: "Flats & Apartments", coords: { lat: 47.5614, lng: 21.6189 }, spaces: [hotelFlats[1], hotelFlats[2], hotelFlats[3]] },
    ],
  },
  {
    id: "inst-6",
    name: "Debreceni Sportcentrum",
    type: "sports",
    city: "Debrecen",
    description: "Indoor sports complex in the heart of Debrecen offering basketball courts, training halls and equipment rental.",
    image: "https://images.unsplash.com/photo-1505666287802-931dc83948e9?w=900",
    rating: 4.7,
    coords: { lat: 47.5586, lng: 21.6363 },
    address: "Oláh Gábor u. 5, 4032 Debrecen",
    buildings: [
      { id: "b13", name: "Main Arena", coords: { lat: 47.5586, lng: 21.6363 }, spaces: [sportsSpaces[3], sportsSpaces[4]] },
    ],
  },
  {
    id: "inst-7",
    name: "Debreceni Közösségi Kert",
    type: "garden",
    city: "Debrecen",
    description: "Community garden in Debrecen where residents can rent garden plots for growing vegetables, herbs, and flowers. Includes shared tools and a greenhouse.",
    image: "https://images.unsplash.com/photo-1592150621744-aca64f48394a?w=600",
    rating: 4.8,
    coords: { lat: 47.5430, lng: 21.6280 },
    address: "Pallagi út, 4032 Debrecen",
    buildings: [
      { id: "b14", name: "Section A — Vegetable Plots", coords: { lat: 47.5430, lng: 21.6280 }, spaces: [gardenPlots[0], gardenPlots[2], gardenPlots[3]] },
      { id: "b15", name: "Section B — Herb & Flower Gardens", coords: { lat: 47.5432, lng: 21.6285 }, spaces: [gardenPlots[1], gardenPlots[4]] },
      { id: "b16", name: "Greenhouse & Facilities", coords: { lat: 47.5428, lng: 21.6283 }, spaces: [gardenPlots[5]] },
    ],
  },
  {
    id: "inst-8",
    name: "Debrecen Stays — Airbnb Collection",
    type: "airbnb",
    city: "Debrecen",
    description: "Curated collection of Airbnb listings across Debrecen — from cozy lofts in the city center to family homes near the Great Forest.",
    image: "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600",
    rating: 4.7,
    coords: { lat: 47.5316, lng: 21.6273 },
    address: "Various locations, Debrecen",
    buildings: [
      { id: "b17", name: "Downtown Listings", coords: { lat: 47.5316, lng: 21.6273 }, spaces: [airbnbListings[0], airbnbListings[1], airbnbListings[5]] },
      { id: "b18", name: "Near University", coords: { lat: 47.5495, lng: 21.6250 }, spaces: [airbnbListings[2], airbnbListings[4]] },
      { id: "b19", name: "Family Homes", coords: { lat: 47.5400, lng: 21.6400 }, spaces: [airbnbListings[3]] },
    ],
  },
];

export const bookings: Booking[] = [
  { id: "bk1", spaceName: "Conference Room A", institutionName: "Hotel Lycium Debrecen", buildingName: "Main Building", date: "2026-02-20", startTime: "09:00", endTime: "12:00", status: "confirmed", capacity: 20 },
  { id: "bk2", spaceName: "Agrár Football Pitch", institutionName: "Agrár Sport Pitch", buildingName: "Outdoor Pitch", date: "2026-02-22", startTime: "18:00", endTime: "20:00", status: "pending", capacity: 22 },
  { id: "bk3", spaceName: "Plot B1 — Large Family Plot", institutionName: "Debreceni Közösségi Kert", buildingName: "Section A — Vegetable Plots", date: "2026-02-18", startTime: "08:00", endTime: "11:00", status: "cancelled", capacity: 4 },
  { id: "bk4", spaceName: "Lecture Hall 101", institutionName: "University of Debrecen", buildingName: "Faculty of Informatics", date: "2026-03-01", startTime: "10:00", endTime: "13:00", status: "confirmed", capacity: 80 },
  { id: "bk5", spaceName: "Main Basketball Court", institutionName: "Debreceni Sportcentrum", buildingName: "Main Arena", date: "2026-02-25", startTime: "17:00", endTime: "19:00", status: "confirmed", capacity: 20 },
];

export const getInstitutionById = (id: string) => institutions.find((i) => i.id === id);

export const getSpaceById = (spaceId: string): { space: Space; building: Building; institution: Institution; campus?: Campus } | undefined => {
  for (const inst of institutions) {
    if (inst.campuses) {
      for (const campus of inst.campuses) {
        for (const building of campus.buildings) {
          const space = building.spaces.find((s) => s.id === spaceId);
          if (space) return { space, building, institution: inst, campus };
        }
      }
    }
    for (const building of inst.buildings) {
      const space = building.spaces.find((s) => s.id === spaceId);
      if (space) return { space, building, institution: inst };
    }
  }
  return undefined;
};

export const typeLabelMap: Record<InstitutionType, string> = {
  hotel: "Hotel",
  university: "University",
  sports: "Sports Facility",
  garden: "Community Garden",
  airbnb: "Airbnb",
};

export const typeBadgeClass: Record<InstitutionType, string> = {
  hotel: "badge-hotel",
  university: "badge-university",
  sports: "badge-sports",
  garden: "badge-garden",
  airbnb: "badge-airbnb",
};
