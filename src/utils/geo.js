// =============================================
// GEO UTILITIES — JogTrack
// Haversine distance, pace, calorie calculations
// =============================================

const EARTH_RADIUS_KM = 6371;

/**
 * Haversine formula — distance between two lat/lng points in km
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Format distance: < 1km show in meters, else km
 */
export function formatDistance(km) {
  if (km < 0.01) return '0.00';
  return km.toFixed(2);
}

/**
 * Calculate pace in min/km from distance(km) and duration(seconds)
 * Returns string like "5:23"
 */
export function calcPace(distanceKm, durationSeconds) {
  if (distanceKm < 0.01 || durationSeconds < 1) return '--:--';
  const paceSeconds = durationSeconds / distanceKm;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.round(paceSeconds % 60);
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Estimate calories burned
 * Formula: MET * weight(kg) * time(hours)
 * MET for running ~8 km/h ≈ 8.0
 */
export function calcCalories(distanceKm, durationSeconds, weightKg = 70) {
  if (distanceKm < 0.01) return 0;
  const hours = durationSeconds / 3600;
  const speedKmh = distanceKm / hours;
  // MET approximation based on speed
  let met = 6;
  if (speedKmh >= 8) met = 8;
  if (speedKmh >= 10) met = 10;
  if (speedKmh >= 12) met = 11.5;
  if (speedKmh >= 14) met = 13.5;
  return Math.round(met * weightKg * hours);
}

/**
 * Format duration seconds → "MM:SS" or "HH:MM:SS"
 */
export function formatDuration(seconds) {
  const s = Math.floor(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Format date to readable string (e.g. "Jumat, 22 Agu")
 */
export function formatDate(isoString) {
  const d = new Date(isoString);
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

/**
 * Format time of day (e.g. "07:30")
 */
export function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

/**
 * Get greeting based on hour
 */
export function getGreeting() {
  const h = new Date().getHours();
  if (h < 5) return 'Selamat Malam';
  if (h < 11) return 'Selamat Pagi';
  if (h < 15) return 'Selamat Siang';
  if (h < 19) return 'Selamat Sore';
  return 'Selamat Malam';
}

/**
 * Motivational quotes
 */
export const QUOTES = [
  { text: "Setiap langkah membawamu lebih dekat ke tujuanmu.", author: "— Unknown" },
  { text: "Lari bukan tentang siapa yang tercepat. Ini tentang siapa yang tidak berhenti.", author: "— Unknown" },
  { text: "Tubuhmu bisa melakukannya. Sekarang tinggal meyakinkan pikiranmu.", author: "— Unknown" },
  { text: "Rasa sakit hanya sementara. Kebanggaan berlangsung selamanya.", author: "— Lance Armstrong" },
  { text: "Kamu tidak harus cepat. Kamu hanya harus bergerak.", author: "— Unknown" },
  { text: "Mulailah dari mana kamu berada. Gunakan apa yang kamu punya.", author: "— Arthur Ashe" },
];
