"use client";

import { useEffect, useMemo } from "react";
import L from "leaflet";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

export type MapSelection = {
  latitude: number;
  longitude: number;
};

export type MapFocusRequest = {
  latitude: number;
  longitude: number;
  id: number;
};

type OSMMapProps = {
  value: MapSelection | null;
  onSelect: (position: MapSelection) => void;
  center: { lat: number; lng: number };
  zoom: number;
  focusRequest: MapFocusRequest | null;
};

// Configurable so another OSM-compatible tile provider can be used later.
const tileUrl =
  process.env.NEXT_PUBLIC_OSM_TILE_URL?.trim() ||
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const tileAttribution =
  process.env.NEXT_PUBLIC_OSM_TILE_ATTRIBUTION?.trim() ||
  "© OpenStreetMap contributors";

const pinSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="36" height="44" viewBox="0 0 36 44" aria-hidden="true">' +
  '<path fill="#5b382a" d="M18 0C8 0 0 8 0 18c0 13 18 26 18 26s18-13 18-26C36 8 28 0 18 0z"/>' +
  '<circle cx="18" cy="18" r="7" fill="#ffffff"/></svg>';

function ClickHandler({
  onSelect,
}: {
  onSelect: (position: MapSelection) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        latitude: event.latlng.lat,
        longitude: event.latlng.lng,
      });
    },
  });
  return null;
}

function FocusHandler({ focusRequest }: { focusRequest: MapFocusRequest | null }) {
  const map = useMap();
  const id = focusRequest?.id;
  const latitude = focusRequest?.latitude;
  const longitude = focusRequest?.longitude;

  useEffect(() => {
    if (id === undefined || latitude === undefined || longitude === undefined) {
      return;
    }
    map.setView([latitude, longitude], 17);
  }, [id, latitude, longitude, map]);

  return null;
}

/** Loaded only in the browser (see location-picker.tsx) to avoid SSR of Leaflet. */
export function OSMMap({
  value,
  onSelect,
  center,
  zoom,
  focusRequest,
}: OSMMapProps) {
  const icon = useMemo(
    () =>
      L.divIcon({
        className: "gg-location-marker",
        html: pinSvg,
        iconSize: [36, 44],
        iconAnchor: [18, 44],
      }),
    [],
  );

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={zoom}
      minZoom={3}
      maxZoom={19}
      scrollWheelZoom={false}
      attributionControl
      className="h-full w-full"
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url={tileUrl}
        attribution={tileAttribution}
        maxZoom={19}
        keepBuffer={2}
      />
      <ClickHandler onSelect={onSelect} />
      <FocusHandler focusRequest={focusRequest} />
      {value && (
        <Marker
          position={[value.latitude, value.longitude]}
          icon={icon}
          draggable
          title="موقع التوصيل المحدد"
          eventHandlers={{
            dragend(event) {
              const marker = event.target as L.Marker;
              const latLng = marker.getLatLng();
              onSelect({
                latitude: latLng.lat,
                longitude: latLng.lng,
              });
            },
          }}
        />
      )}
    </MapContainer>
  );
}
