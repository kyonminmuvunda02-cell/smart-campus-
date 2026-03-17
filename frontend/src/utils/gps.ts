export interface GPSReading {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

/**
 * Wraps navigator.geolocation.getCurrentPosition in a Promise with a configurable timeout.
 * Returns null if GPS is denied, unavailable, or times out — callers must handle the null case.
 */
export async function getCurrentPosition(timeoutMs = 10_000): Promise<GPSReading | null> {
  if (!navigator.geolocation) return null;

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy ?? null,
        }),
      () => resolve(null), // Permission denied or unavailable — resolve null, don't reject
      {
        enableHighAccuracy: true,
        timeout: timeoutMs,
        maximumAge: 0, // always get a fresh reading
      }
    );
  });
}
