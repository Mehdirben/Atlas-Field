import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import area from "@turf/area";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateAreaHectares(geometry: GeoJSON.Polygon | GeoJSON.MultiPolygon): number {
  const areaInSquareMeters = area(geometry);
  return areaInSquareMeters / 10000; // 1 hectare = 10,000 square meters
}
