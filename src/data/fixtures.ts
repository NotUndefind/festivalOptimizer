import type { Venue, Exposition, TimeSlot, Visitor } from '../types/index.js';

export const venues: Venue[] = [
  {
    id: 'venue-1',
    name: 'Galerie du Nord',
  },
  {
    id: 'venue-2',
    name: 'Espace Lumière',
  },
  {
    id: 'venue-3',
    name: 'Centre Photographique',
  },
];

export const expositions: Exposition[] = [
  {
    id: 'expo-1',
    title: 'Instants de Rue',
    themes: ['photo de rue', 'urbain', 'reportage'],
    venueId: 'venue-1',
  },
  {
    id: 'expo-2',
    title: 'Portraits du Monde',
    themes: ['portrait', 'humain', 'ethnicité'],
    venueId: 'venue-2',
  },
  {
    id: 'expo-3',
    title: 'Noir & Blanc Absolu',
    themes: ['noir et blanc', 'abstrait', 'contraste'],
    venueId: 'venue-3',
  },
  {
    id: 'expo-4',
    title: 'Paysages Sauvages',
    themes: ['paysage', 'nature', 'voyage'],
    venueId: 'venue-1',
  },
];

// Affluences : faible (<30%), moyen (50-60%), saturé (>85%)
export const timeSlots: TimeSlot[] = [
  // expo-1 : Instants de Rue
  {
    id: 'slot-1-a',
    expositionId: 'expo-1',
    start: '2026-07-10T10:00:00',
    end: '2026-07-10T12:00:00',
    capacity: 60,
    estimatedAttendance: 12, // faible (~20%)
  },
  {
    id: 'slot-1-b',
    expositionId: 'expo-1',
    start: '2026-07-10T14:00:00',
    end: '2026-07-10T16:00:00',
    capacity: 60,
    estimatedAttendance: 55, // saturé (~92%)
  },

  // expo-2 : Portraits du Monde
  {
    id: 'slot-2-a',
    expositionId: 'expo-2',
    start: '2026-07-10T11:00:00',
    end: '2026-07-10T13:00:00',
    capacity: 50,
    estimatedAttendance: 28, // moyen (~56%)
  },
  {
    id: 'slot-2-b',
    expositionId: 'expo-2',
    start: '2026-07-10T15:00:00',
    end: '2026-07-10T17:00:00',
    capacity: 50,
    estimatedAttendance: 46, // saturé (~92%)
  },

  // expo-3 : Noir & Blanc Absolu
  {
    id: 'slot-3-a',
    expositionId: 'expo-3',
    start: '2026-07-10T09:00:00',
    end: '2026-07-10T11:00:00',
    capacity: 40,
    estimatedAttendance: 8, // faible (~20%)
  },
  {
    id: 'slot-3-b',
    expositionId: 'expo-3',
    start: '2026-07-10T13:00:00',
    end: '2026-07-10T15:00:00',
    capacity: 40,
    estimatedAttendance: 22, // moyen (~55%)
  },

  // expo-4 : Paysages Sauvages
  {
    id: 'slot-4-a',
    expositionId: 'expo-4',
    start: '2026-07-10T10:00:00',
    end: '2026-07-10T12:00:00',
    capacity: 80,
    estimatedAttendance: 18, // faible (~22%)
  },
  {
    id: 'slot-4-b',
    expositionId: 'expo-4',
    start: '2026-07-10T16:00:00',
    end: '2026-07-10T18:00:00',
    capacity: 80,
    estimatedAttendance: 72, // saturé (~90%)
  },
];

// Profils : pressé, thématique, confort, générique
export const visitors: Visitor[] = [
  {
    id: 'visitor-pressed',
    name: 'Alex (Pressé)',
    preferredThemes: ['photo de rue', 'portrait', 'paysage', 'noir et blanc'],
    availableFrom: '2026-07-10T12:00:00',
    availableTo: '2026-07-10T15:00:00', // plage courte (3h)
    maxCrowdRatio: 0.9,
  },
  {
    id: 'visitor-thematic',
    name: 'Sophie (Thématique)',
    preferredThemes: ['photo de rue', 'portrait'],
    availableFrom: '2026-07-10T09:00:00',
    availableTo: '2026-07-10T18:00:00',
    maxCrowdRatio: 0.75,
  },
  {
    id: 'visitor-comfort',
    name: 'Marc (Confort)',
    preferredThemes: ['paysage', 'nature', 'portrait', 'urbain'],
    availableFrom: '2026-07-10T09:00:00',
    availableTo: '2026-07-10T18:00:00',
    maxCrowdRatio: 0.4, // très sensible à la foule
  },
  {
    id: 'visitor-generic',
    name: 'Julie (Générique)',
    preferredThemes: ['photo de rue', 'portrait', 'paysage', 'noir et blanc', 'urbain', 'nature'],
    availableFrom: '2026-07-10T09:00:00',
    availableTo: '2026-07-10T18:00:00',
    maxCrowdRatio: 0.8,
  },
];
