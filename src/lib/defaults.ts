/**
 * Factories for blank jobs/axles and the built-in generic spec profiles.
 *
 * The built-in specs are GENERIC starting points for heavy vehicles — the user
 * is expected to duplicate/edit them with the real manufacturer figures. The
 * three fixed manual limits (toe-out-on-turn diff, steering-box centering, tape
 * out-of-square) are pre-filled from the JOSAM manual.
 */

import type { Axle, Job, SpecProfile, VehicleType } from "./types";
import { MM_PER_DEGREE } from "./calc";

/** Max axles the editor allows per vehicle type (report template extends to fit). */
export const MAX_AXLES: Record<VehicleType, number> = {
  truck: 5,
  trailer: 4,
};

function uid(): string {
  // Available in modern browsers and Node >= 19.
  return crypto.randomUUID();
}

export function newAxle(isSteering: boolean): Axle {
  return {
    id: uid(),
    isSteering,
    left: {},
    right: {},
    steering: isSteering ? {} : undefined,
  };
}

/** A fresh job. Trucks start with a steering axle + one drive axle; trailers with two. */
export function newJob(vehicleType: VehicleType): Job {
  const now = Date.now();
  const axles: Axle[] =
    vehicleType === "truck"
      ? [newAxle(true), newAxle(false)]
      : [newAxle(false), newAxle(false)];
  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    vehicleType,
    header: { date: new Date(now).toISOString().slice(0, 10) },
    D: 6,
    axles,
  };
}

/**
 * An 8×4 truck preset: 4 axles with the two front axles steering. Uses the 8×4
 * tolerance profile.
 */
export function newTruck8x4(): Job {
  const job = newJob("truck");
  job.axles = [newAxle(true), newAxle(true), newAxle(false), newAxle(false)];
  job.specProfileId = "builtin-truck-8x4";
  return job;
}

/** Fixed limits taken straight from the JOSAM manual. */
const MANUAL_FIXED = {
  tootDiffMax: 0.5, // degrees (30')
  steeringBoxMaxMmPerM: MM_PER_DEGREE, // 1°/m ≈ 17.4 mm/m
  tapeDiffMax: 5, // mm
};

export const DEFAULT_SPECS: SpecProfile[] = [
  {
    id: "builtin-truck",
    name: "Generic Truck",
    vehicleType: "truck",
    builtIn: true,
    toe: { min: -1, max: 2.5 }, // mm/m, slight toe-in tolerated on the steer axle
    toeUnit: "mm/m",
    camber: { min: -0.25, max: 0.75 }, // degrees
    caster: { min: 1, max: 4 }, // degrees
    kpi: { min: 4, max: 9 }, // degrees
    outOfSquareMax: 2, // mm/m
    parallelismMax: 2, // mm/m
    maxTurn: { min: 35, max: 45 }, // degrees
    ...MANUAL_FIXED,
  },
  {
    id: "builtin-truck-8x4",
    name: "Truck 8×4 (2 steering)",
    vehicleType: "truck",
    builtIn: true,
    toe: { min: -1, max: 2.5 }, // mm/m
    toeUnit: "mm/m",
    camber: { min: -0.25, max: 0.75 }, // degrees
    caster: { min: 1, max: 4 }, // degrees
    kpi: { min: 4, max: 9 }, // degrees
    outOfSquareMax: 2, // mm/m
    parallelismMax: 2, // mm/m
    maxTurn: { min: 35, max: 45 }, // degrees
    ...MANUAL_FIXED,
  },
  {
    id: "builtin-trailer",
    name: "Generic Trailer",
    vehicleType: "trailer",
    builtIn: true,
    toe: { min: -1.5, max: 1.5 }, // mm/m, near zero
    toeUnit: "mm/m",
    camber: { min: -0.5, max: 0.5 }, // degrees
    caster: { min: 0, max: 0 }, // n/a for non-steered
    kpi: { min: 0, max: 0 }, // n/a for non-steered
    outOfSquareMax: 2, // mm/m
    parallelismMax: 2, // mm/m
    maxTurn: { min: 0, max: 0 }, // n/a
    ...MANUAL_FIXED,
  },
];

/** A blank custom spec profile for the "new profile" form. */
export function newSpecProfile(vehicleType: VehicleType): SpecProfile {
  const base = DEFAULT_SPECS.find((s) => s.vehicleType === vehicleType) ?? DEFAULT_SPECS[0];
  return { ...structuredClone(base), id: uid(), name: "", builtIn: false };
}

/** Default spec profile id for a vehicle type. */
export function defaultSpecId(vehicleType: VehicleType): string {
  return vehicleType === "truck" ? "builtin-truck" : "builtin-trailer";
}
