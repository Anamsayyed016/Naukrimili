interface Location {
  latitude: number;
  longitude: number;
  city: string}

export function calculateDistance(from: Location, to: Location): number {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(to.latitude - from.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(from.latitude)) * Math.cos(toRad(to.latitude)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return Math.round(distance)}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180)}
