// =============================================
// MAP HELPER — Stravan
// Premium Dark Sport Map (Fast, Free, No Watermarks)
// =============================================

/**
 * Render Route Map on a container element
 * @param {string|HTMLElement} containerId - Element ID or element
 * @param {Array<{lat: number, lng: number}>} coords - Array of coordinates
 * @param {boolean} interactive - Allow drag/zoom or keep static
 */
export function renderRouteMap(containerId, coords = [], interactive = false) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;

  // Clean previous content and previous Leaflet instance if any
  container.innerHTML = '';

  // Normalize coords
  const cleanCoords = (coords || [])
    .map(c => {
      if (Array.isArray(c)) return { lat: Number(c[0]), lng: Number(c[1]) };
      if (c && typeof c.lat === 'number' && typeof c.lng === 'number') return { lat: c.lat, lng: c.lng };
      return null;
    })
    .filter(c => c && !isNaN(c.lat) && !isNaN(c.lng));

  // If no coords, show placeholder
  if (cleanCoords.length === 0) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--clr-text-3);font-size:0.85rem;flex-direction:column;gap:8px;">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>Rute GPS tidak terekam</span>
      </div>
    `;
    return null;
  }

  // Use Leaflet with Dark Matter Sport Tiles (100% Free & No Billing Errors)
  if (!window.L) {
    console.error('Leaflet library is not loaded');
    return null;
  }

  try {
    const latLngs = cleanCoords.map(c => [c.lat, c.lng]);
    const lMap = L.map(container, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
      touchZoom: interactive,
      attributionControl: false,
    });

    // Dark Matter Map Tiles (Ultra sleek dark theme matching Strava)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(lMap);

    if (latLngs.length > 1) {
      // Background glow line
      L.polyline(latLngs, {
        color: 'rgba(255, 107, 53, 0.4)',
        weight: 8,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(lMap);

      // Main orange route line
      const poly = L.polyline(latLngs, {
        color: '#FF6B35',
        weight: 5,
        opacity: 1.0,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(lMap);

      lMap.fitBounds(poly.getBounds(), { padding: [30, 30] });

      // Start Marker (Green Pin)
      L.circleMarker(latLngs[0], {
        radius: 8,
        fillColor: '#22C55E',
        color: '#FFFFFF',
        weight: 2.5,
        fillOpacity: 1,
      }).addTo(lMap).bindPopup('🟢 Titik Mulai');

      // Finish Marker (Orange Pin)
      L.circleMarker(latLngs[latLngs.length - 1], {
        radius: 8,
        fillColor: '#FF6B35',
        color: '#FFFFFF',
        weight: 2.5,
        fillOpacity: 1,
      }).addTo(lMap).bindPopup('🏁 Titik Selesai');
    } else {
      lMap.setView(latLngs[0], 16);
      L.circleMarker(latLngs[0], {
        radius: 10,
        fillColor: '#FF6B35',
        color: '#FFFFFF',
        weight: 3,
        fillOpacity: 1,
      }).addTo(lMap).bindPopup('📍 Lokasi Lari');
    }

    setTimeout(() => {
      lMap.invalidateSize();
      if (latLngs.length > 1) {
        const poly = L.polyline(latLngs);
        lMap.fitBounds(poly.getBounds(), { padding: [30, 30] });
      }
    }, 200);

    return lMap;
  } catch (err) {
    console.error('Error rendering route map:', err);
    return null;
  }
}
