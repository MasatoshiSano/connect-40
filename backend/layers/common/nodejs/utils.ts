import { randomUUID } from 'crypto';

/**
 * Generate UUID v4
 */
export const generateId = (): string => randomUUID();

/**
 * Get current ISO timestamp
 */
export const getCurrentTimestamp = (): string => new Date().toISOString();

/**
 * Calculate Geohash for location indexing
 * Simplified implementation (precision 7: ~153m)
 */
export const encodeGeohash = (lat: number, lng: number, precision = 7): string => {
  const BASE32 = '0123456789bcdefghjkmnpqrstuvwxyz';
  let latMin = -90,
    latMax = 90;
  let lngMin = -180,
    lngMax = 180;
  let geohash = '';
  let isEven = true;
  let bit = 0;
  let ch = 0;

  while (geohash.length < precision) {
    if (isEven) {
      const mid = (lngMin + lngMax) / 2;
      if (lng > mid) {
        ch |= 1 << (4 - bit);
        lngMin = mid;
      } else {
        lngMax = mid;
      }
    } else {
      const mid = (latMin + latMax) / 2;
      if (lat > mid) {
        ch |= 1 << (4 - bit);
        latMin = mid;
      } else {
        latMax = mid;
      }
    }

    isEven = !isEven;

    if (bit < 4) {
      bit++;
    } else {
      geohash += BASE32[ch];
      bit = 0;
      ch = 0;
    }
  }

  return geohash;
};

/**
 * Calculate distance between two coordinates using Haversine formula
 * @returns distance in kilometers
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Create API Gateway response
 */
export const createResponse = (statusCode: number, body: unknown) => ({
  statusCode,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Credentials': true,
  },
  body: JSON.stringify(body),
});

/**
 * Create success response
 */
export const successResponse = <T>(data: T) => createResponse(200, { data });

/**
 * Create error response
 */
export const errorResponse = (
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string>
) =>
  createResponse(statusCode, {
    error: { code, message, details },
  });
