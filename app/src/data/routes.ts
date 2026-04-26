import type { Route } from '../types';

// Sample route in San Francisco — 2 pickups (restaurants), 3 deliveries (residential).
// Coordinates are real and walkable in the Mission / SoMa neighborhoods.
export const sampleRoute: Route = {
  id: 'route-001',
  operatorName: 'Maria Chen',
  stops: [
    {
      id: 'stop-1',
      type: 'pickup',
      name: "Tartine Bakery",
      address: '600 Guerrero St, San Francisco, CA 94110',
      lat: 37.7614,
      lng: -122.4241,
      status: 'pending',
    },
    {
      id: 'stop-2',
      type: 'pickup',
      name: "La Taqueria",
      address: '2889 Mission St, San Francisco, CA 94110',
      lat: 37.7508,
      lng: -122.4180,
      status: 'pending',
    },
    {
      id: 'stop-3',
      type: 'delivery',
      name: 'Apt 4B — Sarah Wong',
      address: '123 Oak St, San Francisco, CA 94102',
      lat: 37.7744,
      lng: -122.4244,
      status: 'pending',
    },
    {
      id: 'stop-4',
      type: 'delivery',
      name: 'Unit 12 — David Park',
      address: '450 Pine Ave, San Francisco, CA 94108',
      lat: 37.7905,
      lng: -122.4099,
      status: 'pending',
    },
    {
      id: 'stop-5',
      type: 'delivery',
      name: 'House — Liu family',
      address: '78 Maple Rd, San Francisco, CA 94117',
      lat: 37.7693,
      lng: -122.4481,
      status: 'pending',
    },
  ],
};

export const FAILURE_REASONS = [
  'No one home',
  'Wrong address',
  'Damaged package',
] as const;
