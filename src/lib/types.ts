/**
 * Domain model for the JOSAM AM39 alignment app.
 *
 * A Job is one measurement session for one vehicle. It holds a shared distance
 * D (metres between the front and rear frame-gauge scales) and a list of axles.
 * Each axle has a left and right wheel reading; the steering (front) axle of a
 * truck additionally carries caster/KPI/turn measurements.
 */

import type { AngleDM } from "./calc";

export type VehicleType = "truck" | "trailer";

/** A raw reading for one wheel, plus its optional per-wheel angles. */
export interface WheelReading {
  /** Front frame-gauge scale reading (mm). */
  A?: number;
  /** Rear frame-gauge scale reading (mm). */
  B?: number;
  /**
   * Run-out compensation (manual p.13): the scale value with the laser at its
   * start position, and again after half a turn of the wheel. The adapter is
   * then trimmed until the dot sits midway between the two. Workshop aid only —
   * never printed on the report.
   */
  runoutStart?: number;
  runoutHalf?: number;
  /** Camber angle (all axles, optional). */
  camber?: AngleDM;
  /** Caster angle (steering axle only, optional). */
  caster?: AngleDM;
  /** Kingpin inclination (steering axle only, optional). */
  kpi?: AngleDM;
}

/** One turn measurement: inner wheel turned to `reference`°, outer reads `opposite`°. */
export interface TurnMeasurement {
  /** Reference angle the inner wheel is turned to (°), usually 20. */
  reference?: number;
  /** Angle read on the opposite (outer) wheel (°). */
  opposite?: number;
}

/** Extra measurements that only apply to a steering (front) axle. */
export interface SteeringExtras {
  /** Toe-out on turn, wheels steered left. */
  turnLeft?: TurnMeasurement;
  /** Toe-out on turn, wheels steered right. */
  turnRight?: TurnMeasurement;
  /** Maximum steering lock, left wheel (°). */
  maxTurnLeft?: number;
  /** Maximum steering lock, right wheel (°). */
  maxTurnRight?: number;
  /** Steering-box centering: front scale reading (mm). */
  steeringBoxA?: number;
  /** Steering-box centering: rear scale reading (mm). */
  steeringBoxB?: number;
  /** Tape measure, left spring-eye to reference (mm). */
  tapeLeft?: number;
  /** Tape measure, right spring-eye to reference (mm). */
  tapeRight?: number;
}

/** Which pass of the procedure a saved reading belongs to. */
export type ReadingStage = "initial" | "adjusted" | "final";

/**
 * One saved set of scale readings for an axle.
 *
 * The shop procedure measures, adjusts the track rod, and measures again, so a
 * job accumulates several readings per axle. The axle's own `left`/`right` hold
 * the current (final) values that the AM39 report prints; this trail is kept
 * for the app's history tab only.
 */
export interface AxleReading {
  id: string;
  /** Saved at (epoch ms). */
  at: number;
  stage: ReadingStage;
  /** Distance between the scales when this reading was taken (m). */
  D: number;
  left: { A?: number; B?: number };
  right: { A?: number; B?: number };
}

export interface Axle {
  /** Stable id for React keys and updates. */
  id: string;
  /** True only for the front axle of a truck. */
  isSteering: boolean;
  left: WheelReading;
  right: WheelReading;
  /** Every reading saved for this axle, oldest first. Never printed. */
  readings?: AxleReading[];
  /** Present when isSteering. */
  steering?: SteeringExtras;
}

export interface JobHeader {
  orderNo?: string;
  /** Vehicle type / make / model text (free form, from the JOSAM sheet). */
  type?: string;
  regNo?: string;
  owner?: string;
  /** ISO date string (yyyy-mm-dd). */
  date?: string;
  sign?: string;
  milesKm?: string;
  notes?: string;
}

export interface Job {
  id: string;
  createdAt: number;
  updatedAt: number;
  vehicleType: VehicleType;
  header: JobHeader;
  /** Distance between front (A) and rear (B) frame-gauge scales, in metres. */
  D: number;
  /** Which spec profile decides good/bad for this job. */
  specProfileId?: string;
  axles: Axle[];
}

/** Inclusive numeric range used for pass/fail bands. */
export interface Range {
  min: number;
  max: number;
}

/** How the user prefers to see/enter toe. */
export type ToeUnit = "mm/m" | "deg";

/**
 * A reusable tolerance sheet. Angle ranges (camber/caster/kpi/maxTurn) are in
 * decimal degrees; toe / out-of-square / parallelism are in mm/m.
 */
export interface SpecProfile {
  id: string;
  name: string;
  vehicleType: VehicleType;
  /** Seeded defaults are marked built-in (still editable, cannot be the only one). */
  builtIn?: boolean;

  /** Toe band, mm/m (+ = toe-in). */
  toe: Range;
  /** Preferred display unit for toe. */
  toeUnit: ToeUnit;
  /** Camber band, decimal degrees. */
  camber: Range;
  /** Caster band, decimal degrees (steering axle). */
  caster: Range;
  /** KPI band, decimal degrees (steering axle). */
  kpi: Range;
  /** Max absolute out-of-square per axle, mm/m. */
  outOfSquareMax: number;
  /** Max absolute axle-to-axle parallelism difference, mm/m. */
  parallelismMax: number;
  /** Max steering lock band, degrees (steering axle). */
  maxTurn: Range;

  /** Fixed manual limits (defaults provided, editable): */
  /** Max toe-out-on-turn difference between sides, degrees (manual: 0.5°). */
  tootDiffMax: number;
  /** Max steering-box centering deviation, mm/m (manual: 1°/m ≈ 17.4). */
  steeringBoxMaxMmPerM: number;
  /** Max tape-measure out-of-square difference, mm (manual: 5). */
  tapeDiffMax: number;
}

/**
 * Which pair of measuring scales an axle is read against, as named on the AM39
 * sheet. A truck sheet has one pair (A1/B1 left, A2/B2 right); a trailer sheet
 * has a second pair further back for axles 3 and 4.
 */
export function scaleNumbers(vehicleType: VehicleType, axleIndex: number): { left: number; right: number } {
  const block = vehicleType === "trailer" && axleIndex >= 2 ? 1 : 0;
  return { left: block * 2 + 1, right: block * 2 + 2 };
}

/** Zero-based axle index -> the JOSAM C-numbers for its left/right wheels. */
export function wheelNumbers(axleIndex: number): { left: number; right: number } {
  return { left: axleIndex * 2 + 1, right: axleIndex * 2 + 2 };
}
