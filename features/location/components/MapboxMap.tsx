"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { Box } from "@mantine/core";

const MAP_STYLE = "mapbox://styles/mapbox/dark-v11";
const LOCATION = {
  lat: 59.33729,
  lng: 18.05531,
};

export const MapboxMap = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) {
      return;
    }

    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (!token) {
      return;
    }

    mapboxgl.accessToken = token;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE,
      center: [LOCATION.lng, LOCATION.lat],
      zoom: 15.5,
      pitch: 42,
      bearing: -18,
      antialias: true,
    });

    map.addControl(new mapboxgl.FullscreenControl(), "top-right");

    new mapboxgl.Marker({ color: "#95B354" })
      .setLngLat([LOCATION.lng, LOCATION.lat])
      .addTo(map);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  return (
    <Box
      pos="relative"
      style={{
        borderRadius: "var(--mantine-radius-md)",
        overflow: "hidden",
      }}
    >
      <Box
        ref={mapContainerRef}
        style={{
          height: "420px",
          width: "100%",
        }}
      />
      <Box
        pos="absolute"
        inset={0}
        style={{
          pointerEvents: "none",
          background:
            "linear-gradient(140deg, rgba(149,179,84,0.12) 0%, rgba(13,13,12,0.65) 55%)",
          mixBlendMode: "screen",
        }}
      />
    </Box>
  );
};
