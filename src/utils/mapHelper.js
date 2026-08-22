// =============================================
// MAP HELPER — Stravan
// Google Maps API integration with Leaflet fallback
// =============================================

const GOOGLE_MAPS_KEY = "AIzaSyC7d_YLtxXpi6oYoHCjykbHnQXs-zqNXY0";

// Ensure Google Maps Script is Loaded
let googleMapsLoaded = false;
let googleMapsPromise = null;

export function loadGoogleMaps() {
  if (googleMapsLoaded && window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (googleMapsPromise) return googleMapsPromise;

  googleMapsPromise = new Promise((resolve) => {
    if (window.google && window.google.maps) {
      googleMapsLoaded = true;
      resolve(window.google.maps);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&libraries=geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      googleMapsLoaded = true;
      resolve(window.google.maps);
    };
    script.onerror = () => {
      console.warn('Google Maps API failed to load, falling back to Leaflet...');
      resolve(null);
    };
    document.head.appendChild(script);
  });

  return googleMapsPromise;
}

/**
 * Render Route Map on a container element
 * @param {string|HTMLElement} containerId - Element ID or element
 * @param {Array<{lat: number, lng: number}>} coords - Array of coordinates
 * @param {boolean} interactive - Allow drag/zoom or keep static
 */
export async function renderRouteMap(containerId, coords = [], interactive = false) {
  const container = typeof containerId === 'string' ? document.getElementById(containerId) : containerId;
  if (!container) return null;

  // Clean container
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

  // Try Google Maps first
  const gmaps = await loadGoogleMaps();
  if (gmaps) {
    try {
      const mapOptions = {
        zoom: 16,
        center: cleanCoords[0],
        disableDefaultUI: !interactive,
        zoomControl: interactive,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        gestureHandling: interactive ? 'auto' : 'none',
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          {
            featureType: "administrative.locality",
            elementType: "labels.text.fill",
            stylers: [{ color: "#d59563" }],
          },
          {
            featureType: "road",
            elementType: "geometry",
            stylers: [{ color: "#38414e" }],
          },
          {
            featureType: "road",
            elementType: "geometry.stroke",
            stylers: [{ color: "#212a37" }],
          },
          {
            featureType: "road",
            elementType: "labels.text.fill",
            stylers: [{ color: "#9ca5b3" }],
          },
          {
            featureType: "water",
            elementType: "geometry",
            stylers: [{ color: "#17263c" }],
          },
        ]
      };

      const gMap = new gmaps.Map(container, mapOptions);

      // Draw Route Polyline
      if (cleanCoords.length > 1) {
        const polyline = new gmaps.Polyline({
          path: cleanCoords,
          geodesic: true,
          strokeColor: '#FF6B35',
          strokeOpacity: 1.0,
          strokeWeight: 5,
        });
        polyline.setMap(gMap);

        // Adjust bounds
        const bounds = new gmaps.LatLngBounds();
        cleanCoords.forEach(c => bounds.extend(c));
        gMap.fitBounds(bounds, { top: 30, bottom: 30, left: 30, right: 30 });
      }

      // Start Marker (Green)
      new gmaps.Marker({
        position: cleanCoords[0],
        map: gMap,
        title: 'Mulai',
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: '#22C55E',
          fillOpacity: 1,
          strokeColor: '#FFFFFF',
          strokeWeight: 2,
        },
      });

      // End Marker (Orange) if > 1
      if (cleanCoords.length > 1) {
        new gmaps.Marker({
          position: cleanCoords[cleanCoords.length - 1],
          map: gMap,
          title: 'Selesai',
          icon: {
            path: gmaps.SymbolPath.CIRCLE,
            scale: 7,
            fillColor: '#FF6B35',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
          },
        });
      }

      setTimeout(() => {
        gmaps.event.trigger(gMap, 'resize');
        if (cleanCoords.length > 1) {
          const bounds = new gmaps.LatLngBounds();
          cleanCoords.forEach(c => bounds.extend(c));
          gMap.fitBounds(bounds, { top: 30, bottom: 30, left: 30, right: 30 });
        }
      }, 200);

      return gMap;
    } catch (err) {
      console.warn('Google Maps render failed, trying Leaflet fallback:', err);
    }
  }

  // Fallback: Leaflet Map
  if (window.L) {
    try {
      const latLngs = cleanCoords.map(c => [c.lat, c.lng]);
      const lMap = L.map(container, {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        touchZoom: interactive,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
      }).addTo(lMap);

      if (latLngs.length > 1) {
        const poly = L.polyline(latLngs, { color: '#FF6B35', weight: 5 }).addTo(lMap);
        lMap.fitBounds(poly.getBounds(), { padding: [25, 25] });
        L.circleMarker(latLngs[0], { radius: 8, fillColor: '#22C55E', color: 'white', weight: 2, fillOpacity: 1 }).addTo(lMap);
        L.circleMarker(latLngs[latLngs.length - 1], { radius: 8, fillColor: '#FF6B35', color: 'white', weight: 2, fillOpacity: 1 }).addTo(lMap);
      } else {
        lMap.setView(latLngs[0], 16);
        L.circleMarker(latLngs[0], { radius: 10, fillColor: '#FF6B35', color: 'white', weight: 3, fillOpacity: 1 }).addTo(lMap);
      }

      setTimeout(() => lMap.invalidateSize(), 200);
      return lMap;
    } catch (lErr) {
      console.error('Leaflet fallback error:', lErr);
    }
  }

  return null;
}
