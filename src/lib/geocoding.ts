/**
 * Server-side geocoding using Nominatim (OpenStreetMap) — FREE, no API key needed
 * Rate limit: max 1 request/second, include a User-Agent
 */
export async function geocodeAddress(address: string): Promise<{
  lat: number;
  lng: number;
  formattedAddress: string;
} | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: address,
          format: 'json',
          addressdetails: '1',
          limit: '1',
          'accept-language': 'id',
        }),
      {
        headers: {
          'User-Agent': 'FamilyTreeApp/1.0',
        },
      }
    );

    const data = await response.json();

    if (data && data.length > 0) {
      const result = data[0];
      return {
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        formattedAddress: result.display_name,
      };
    }

    console.warn('Geocoding: no results for address:', address);
    return null;
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}
