"use client";

import { useRef, useEffect, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { cn } from "@/lib/utils";
import { Site, CommunitySignal, SignalType, getCommunitySignals, createCommunitySignal } from "@/lib/api";
import SignalModal from "./SignalModal";
import { BellIcon } from "@/components/icons";

interface FieldMapProps {
  fields?: Site[];  // Accept sites (backwards compatible prop name)
  onFieldClick?: (siteId: number) => void;  // Backwards compatible
  zoom?: number;
  center?: [number, number];
  editable?: boolean;
  onPolygonComplete?: (coordinates: number[][][]) => void;
}

export default function FieldMap({
  fields = [],
  onFieldClick,
  zoom = 6,
  center = [2.3522, 46.6034], // France center
  editable = false,
  onPolygonComplete,
}: FieldMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState<[number, number][]>([]);

  // Community Signals State
  const [isReporting, setIsReporting] = useState(false);
  const [signals, setSignals] = useState<CommunitySignal[]>([]);
  const [reportCoords, setReportCoords] = useState<[number, number] | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          satellite: {
            type: "raster",
            tiles: [
              "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
            ],
            tileSize: 256,
            attribution:
              "© Esri, Maxar, Earthstar Geographics, and the GIS User Community",
            maxzoom: 19,
          },
        },
        layers: [
          {
            id: "satellite",
            type: "raster",
            source: "satellite",
          },
        ],
      },
      center: center,
      zoom: zoom,
    });

    map.current.addControl(new maplibregl.NavigationControl(), "top-right");

    // Fetch initial signals
    const fetchSignals = async () => {
      try {
        const data = await getCommunitySignals();
        setSignals(data);
      } catch (error) {
        console.error("Failed to fetch signals:", error);
      }
    };
    fetchSignals();

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add fields to map
  useEffect(() => {
    if (!map.current || fields.length === 0) return;

    const addFields = () => {
      // Remove existing sources and layers
      fields.forEach((_, i) => {
        if (map.current?.getLayer(`field-fill-${i}`)) {
          map.current.removeLayer(`field-fill-${i}`);
        }
        if (map.current?.getLayer(`field-outline-${i}`)) {
          map.current.removeLayer(`field-outline-${i}`);
        }
        if (map.current?.getSource(`field-${i}`)) {
          map.current.removeSource(`field-${i}`);
        }
      });

      // Add fields/sites
      fields.forEach((site, i) => {
        if (!site.geometry?.coordinates) return;

        map.current?.addSource(`field-${i}`, {
          type: "geojson",
          data: {
            type: "Feature",
            properties: { id: site.id, name: site.name },
            geometry: site.geometry,
          },
        });

        // Color based on site type and health
        let color = "#1b9b1"; // Default emerald
        if (site.site_type === "FOREST") {
          // Heatmap colors for fire risk
          color = site.fire_risk_level?.toUpperCase() === "LOW"
            ? "#22c55e" // green-500
            : (site.fire_risk_level?.toUpperCase() === "MEDIUM" || site.fire_risk_level?.toUpperCase() === "MODERATE")
              ? "#f59e0b" // amber-500
              : site.fire_risk_level?.toUpperCase() === "HIGH" || site.fire_risk_level?.toUpperCase() === "CRITICAL"
                ? "#ef4444" // red-500
                : "#22c55e"; // default green-500 for forests
        } else {
          // Field coloring based on NDVI
          color = site.latest_ndvi
            ? site.latest_ndvi >= 0.6
              ? "#10b981"
              : site.latest_ndvi >= 0.4
                ? "#f59e0b"
                : "#ef4444"
            : "#6b7280";
        }

        map.current?.addLayer({
          id: `field-fill-${i}`,
          type: "fill",
          source: `field-${i}`,
          paint: {
            "fill-color": color,
            "fill-opacity": 0.3,
          },
        });

        map.current?.addLayer({
          id: `field-outline-${i}`,
          type: "line",
          source: `field-${i}`,
          paint: {
            "line-color": color,
            "line-width": 2,
          },
        });

        if (onFieldClick) {
          map.current?.on("click", `field-fill-${i}`, () => {
            onFieldClick(site.id);
          });
          map.current?.on("mouseenter", `field-fill-${i}`, () => {
            if (map.current) map.current.getCanvas().style.cursor = "pointer";
          });
          map.current?.on("mouseleave", `field-fill-${i}`, () => {
            if (map.current) map.current.getCanvas().style.cursor = "";
          });
        }
      });

      // Fit bounds to all sites
      if (fields.length > 0 && fields[0].geometry?.coordinates) {
        const bounds = new maplibregl.LngLatBounds();
        fields.forEach((site) => {
          site.geometry?.coordinates?.[0]?.forEach((coord: number[]) => {
            bounds.extend([coord[0], coord[1]]);
          });
        });
        map.current?.fitBounds(bounds, { padding: 50 });
      }
    };

    if (map.current.isStyleLoaded()) {
      addFields();
    } else {
      map.current.on("load", addFields);
    }
  }, [fields, onFieldClick]);

  // Drawing functionality
  useEffect(() => {
    if (!map.current || !editable) return;

    const handleClick = (e: maplibregl.MapMouseEvent) => {
      if (!isDrawing) return;
      const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      setDrawPoints((prev) => [...prev, newPoint]);
    };

    const handleDblClick = (e: maplibregl.MapMouseEvent) => {
      e.preventDefault();
      if (drawPoints.length >= 3 && onPolygonComplete) {
        const closedPolygon = [...drawPoints, drawPoints[0]];
        onPolygonComplete([closedPolygon]);
        setDrawPoints([]);
        setIsDrawing(false);
      }
    };

    map.current.on("click", handleClick);
    map.current.on("dblclick", handleDblClick);

    return () => {
      map.current?.off("click", handleClick);
      map.current?.off("dblclick", handleDblClick);
    };
  }, [editable, isDrawing, drawPoints, onPolygonComplete]);

  // Handle Reporting Click
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: maplibregl.MapMouseEvent) => {
      if (!isReporting) return;

      setReportCoords([e.lngLat.lng, e.lngLat.lat]);
      setIsModalOpen(true);
      setIsReporting(false); // Mode ends after click
    };

    map.current.on("click", handleMapClick);

    return () => {
      map.current?.off("click", handleMapClick);
    };
  }, [isReporting]);

  // Render Community Signals
  useEffect(() => {
    if (!map.current || signals.length === 0) return;

    const updateSignals = () => {
      if (!map.current) return;

      // Remove existing signal markers
      const existingMarkers = document.querySelectorAll('.community-signal-marker');
      existingMarkers.forEach(m => m.remove());

      signals.forEach(signal => {
        const el = document.createElement('div');
        el.className = 'community-signal-marker group relative';

        const iconMap: Record<SignalType, string> = {
          DANGER: '⚠️',
          ANIMAL: '🦌',
          FIRE: '🔥',
          ROAD_BLOCK: '🚧',
          OTHER: '📍'
        };

        const colorMap: Record<SignalType, string> = {
          DANGER: 'bg-red-500',
          ANIMAL: 'bg-amber-500',
          FIRE: 'bg-orange-600',
          ROAD_BLOCK: 'bg-yellow-600',
          OTHER: 'bg-blue-500'
        };

        el.innerHTML = `
          <div class="w-10 h-10 ${colorMap[signal.type]} rounded-full flex items-center justify-center text-xl shadow-lg cursor-pointer transform hover:scale-110 transition-transform">
            ${iconMap[signal.type]}
          </div>
          <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-white rounded-lg shadow-xl p-3 text-xs hidden group-hover:block z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
            <div class="font-bold text-slate-900 flex justify-between">
              <span>${signal.type.replace('_', ' ')}</span>
              <span class="text-[10px] text-slate-400 font-normal">${new Date(signal.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
            ${signal.description ? `<p class="text-slate-600 mt-1">${signal.description}</p>` : ''}
            <div class="mt-2 pt-2 border-t border-slate-100 flex justify-between items-center text-[10px]">
              <span class="text-slate-400">By ${signal.user_name || 'Anonymous'}</span>
            </div>
          </div>
        `;

        new maplibregl.Marker({ element: el })
          .setLngLat([signal.longitude, signal.latitude])
          .addTo(map.current!);
      });
    };

    if (map.current.isStyleLoaded()) {
      updateSignals();
    } else {
      map.current.on("load", updateSignals);
    }
  }, [signals]);

  const handleSignalSubmit = async (type: SignalType, description: string) => {
    if (!reportCoords) return;

    try {
      const newSignalData = {
        type,
        description,
        latitude: reportCoords[1],
        longitude: reportCoords[0],
      };

      const response = await createCommunitySignal(newSignalData);
      setSignals(prev => [response, ...prev]);
      setIsModalOpen(false);
      setReportCoords(null);
    } catch (error) {
      console.error("Failed to create signal:", error);
    }
  };

  // Draw preview polygon
  useEffect(() => {
    if (!map.current || drawPoints.length === 0) return;

    const sourceId = "draw-preview";
    const layerId = "draw-preview-fill";
    const lineId = "draw-preview-line";

    if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    if (map.current.getLayer(lineId)) map.current.removeLayer(lineId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    const coordinates = drawPoints.length >= 3 ? [...drawPoints, drawPoints[0]] : drawPoints;

    const geometry = drawPoints.length >= 3
      ? { type: "Polygon" as const, coordinates: [coordinates] }
      : { type: "LineString" as const, coordinates: coordinates };

    map.current.addSource(sourceId, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry,
      },
    });

    if (drawPoints.length >= 3) {
      map.current.addLayer({
        id: layerId,
        type: "fill",
        source: sourceId,
        paint: { "fill-color": "#10b981", "fill-opacity": 0.3 },
      });
    }

    map.current.addLayer({
      id: lineId,
      type: "line",
      source: sourceId,
      paint: { "line-color": "#10b981", "line-width": 2 },
    });
  }, [drawPoints]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />

      {/* Map Controls - Top Left */}
      <div className="absolute top-4 left-4 z-10 flex flex-col sm:flex-row gap-2 max-w-[calc(100%-100px)]">
        {editable && (
          <button
            onClick={() => {
              setIsDrawing(!isDrawing);
              if (!isDrawing) setDrawPoints([]);
              setIsReporting(false);
            }}
            className={cn(
              "grow px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl whitespace-nowrap",
              isDrawing
                ? "bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-500/20"
                : "bg-white/90 backdrop-blur-md text-emerald-600 border border-emerald-100 hover:bg-white hover:border-emerald-200"
            )}
          >
            <span className="text-lg">{isDrawing ? "✖" : "📐"}</span>
            {isDrawing ? "Cancel Drawing" : "Draw Boundary"}
          </button>
        )}

        <button
          onClick={() => {
            setIsReporting(!isReporting);
            setIsDrawing(false);
          }}
          className={cn(
            "grow px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-xl whitespace-nowrap",
            isReporting
              ? "bg-red-500 text-white hover:bg-red-600 ring-4 ring-red-500/20"
              : "bg-white/90 backdrop-blur-md text-amber-600 border border-amber-100 hover:bg-white hover:border-amber-200"
          )}
        >
          <BellIcon className={cn("w-5 h-5", isReporting ? "text-white" : "text-amber-500")} />
          {isReporting ? "Cancel Report" : "Report Hazard"}
        </button>

        {(isDrawing || isReporting) && (
          <div className="bg-slate-900/90 backdrop-blur-md text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2 animate-in fade-in slide-in-from-left-4 duration-300 shadow-xl border border-white/10">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            {isDrawing
              ? "Click to add points. Double-click to finish."
              : "Tap anywhere on the map to place your report."
            }
          </div>
        )}
      </div>

      {reportCoords && (
        <SignalModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setReportCoords(null);
          }}
          onSubmit={handleSignalSubmit}
          latitude={reportCoords[1]}
          longitude={reportCoords[0]}
        />
      )}
    </div>
  );
}
