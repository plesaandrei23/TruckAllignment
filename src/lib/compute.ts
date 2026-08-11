/**
 * Turn a raw Job + SpecProfile into fully computed, judged results.
 *
 * This is the single source of truth used by BOTH the live editor and the
 * printed AM39 report, so on-screen numbers and the report always agree.
 */

import {
  rollingDirection,
  scaleDifference,
  sideDifference,
  toe as toeSum,
  toeKind as classifyToe,
  outOfSquare,
  outOfSquareSide,
  parallelismDiff,
  angleToDecimal,
  toeOutOnTurn,
  steeringBoxDeviation,
  type ToeKind,
  type Side,
} from "./calc";
import type { Axle, Job, SpecProfile, WheelReading } from "./types";
import { wheelNumbers } from "./types";
import {
  verdictRange,
  verdictMax,
  overallVerdict,
  type Verdict,
  type VerdictStatus,
} from "./verdict";

export interface WheelComputed {
  /** Raw scale difference A − B (mm), before dividing by D. */
  diff?: number;
  /** Rolling direction C/Dm (mm/m). */
  rolling?: number;
  camberDeg?: number;
  camberVerdict: Verdict;
  casterDeg?: number;
  casterVerdict: Verdict;
  kpiDeg?: number;
  kpiVerdict: Verdict;
}

export interface SteeringComputed {
  turnLeftDiff?: number; // degrees
  turnRightDiff?: number; // degrees
  tootDiff?: number; // |left - right| degrees
  tootVerdict: Verdict;
  steeringBoxDev?: number; // mm/m
  steeringBoxVerdict: Verdict;
  tapeDiff?: number; // mm
  tapeVerdict: Verdict;
  maxTurnLeftVerdict: Verdict;
  maxTurnRightVerdict: Verdict;
}

export interface AxleComputed {
  id: string;
  index: number;
  isSteering: boolean;
  wheelNo: { left: number; right: number };
  /** Left (A−B) minus right (A−B), in mm. + = the left side reads more. */
  sideDiff?: number;
  cLeft?: number;
  cRight?: number;
  toe?: number;
  toeKind: ToeKind | "unknown";
  toeVerdict: Verdict;
  oos?: number;
  oosSide: Side | "unknown";
  oosVerdict: Verdict;
  left: WheelComputed;
  right: WheelComputed;
  steering?: SteeringComputed;
  /** Roll-up of every judged value on this axle. */
  status: VerdictStatus;
}

export interface ParallelismComputed {
  /** Axle indices being compared (reference is `from`). */
  from: number;
  to: number;
  value?: number; // mm/m signed
  verdict: Verdict;
}

export interface JobComputed {
  axles: AxleComputed[];
  parallelism: ParallelismComputed[];
  status: VerdictStatus;
}

/**
 * D is only usable once the technician has entered a real distance. Until then
 * (blank field, 0, mid-typing) every derived value is simply "not known yet" —
 * `rollingDirection` would throw, and a half-filled form must never crash.
 */
function usableD(d: number): boolean {
  return Number.isFinite(d) && d > 0;
}

function usableReading(v: number | undefined): v is number {
  return v !== undefined && Number.isFinite(v);
}

function computeWheel(
  wheel: WheelReading,
  spec: SpecProfile | undefined,
  isSteering: boolean,
  d: number,
): WheelComputed {
  const bothScales = usableReading(wheel.A) && usableReading(wheel.B);
  // A − B needs no D, so it shows as soon as both plaques are keyed in.
  const diff = bothScales ? scaleDifference(wheel.A!, wheel.B!) : undefined;
  const rolling = bothScales && usableD(d) ? rollingDirection(wheel.A!, wheel.B!, d) : undefined;
  const camberDeg = wheel.camber ? angleToDecimal(wheel.camber) : undefined;
  const casterDeg = wheel.caster ? angleToDecimal(wheel.caster) : undefined;
  const kpiDeg = wheel.kpi ? angleToDecimal(wheel.kpi) : undefined;
  return {
    diff,
    rolling,
    camberDeg,
    camberVerdict: verdictRange(camberDeg, spec?.camber),
    casterDeg,
    casterVerdict: isSteering ? verdictRange(casterDeg, spec?.caster) : { status: "unknown" },
    kpiDeg,
    kpiVerdict: isSteering ? verdictRange(kpiDeg, spec?.kpi) : { status: "unknown" },
  };
}

function computeSteering(
  axle: Axle,
  spec: SpecProfile | undefined,
  d: number,
): SteeringComputed {
  const s = axle.steering ?? {};

  const turnLeftDiff =
    s.turnLeft?.reference !== undefined && s.turnLeft?.opposite !== undefined
      ? toeOutOnTurn(s.turnLeft.reference, s.turnLeft.opposite)
      : undefined;
  const turnRightDiff =
    s.turnRight?.reference !== undefined && s.turnRight?.opposite !== undefined
      ? toeOutOnTurn(s.turnRight.reference, s.turnRight.opposite)
      : undefined;
  const tootDiff =
    turnLeftDiff !== undefined && turnRightDiff !== undefined
      ? Math.abs(turnLeftDiff - turnRightDiff)
      : undefined;

  const steeringBoxDev =
    usableD(d) && usableReading(s.steeringBoxA) && usableReading(s.steeringBoxB)
      ? steeringBoxDeviation(s.steeringBoxA, s.steeringBoxB, d)
      : undefined;

  const tapeDiff =
    s.tapeLeft !== undefined && s.tapeRight !== undefined
      ? Math.abs(s.tapeLeft - s.tapeRight)
      : undefined;

  return {
    turnLeftDiff,
    turnRightDiff,
    tootDiff,
    tootVerdict: verdictMax(tootDiff, spec?.tootDiffMax),
    steeringBoxDev,
    steeringBoxVerdict: verdictMax(steeringBoxDev, spec?.steeringBoxMaxMmPerM),
    tapeDiff,
    tapeVerdict: verdictMax(tapeDiff, spec?.tapeDiffMax),
    maxTurnLeftVerdict: verdictRange(s.maxTurnLeft, spec?.maxTurn),
    maxTurnRightVerdict: verdictRange(s.maxTurnRight, spec?.maxTurn),
  };
}

function computeAxle(
  axle: Axle,
  index: number,
  spec: SpecProfile | undefined,
  d: number,
): AxleComputed {
  const left = computeWheel(axle.left, spec, axle.isSteering, d);
  const right = computeWheel(axle.right, spec, axle.isSteering, d);

  const sideDiff =
    left.diff !== undefined && right.diff !== undefined ? sideDifference(left.diff, right.diff) : undefined;

  const cLeft = left.rolling;
  const cRight = right.rolling;
  const bothWheels = cLeft !== undefined && cRight !== undefined;

  const toe = bothWheels ? toeSum(cLeft!, cRight!) : undefined;
  const oos = bothWheels ? outOfSquare(cLeft!, cRight!) : undefined;

  const toeVerdict = verdictRange(toe, spec?.toe);
  const oosVerdict = verdictMax(oos, spec?.outOfSquareMax);

  const steering = axle.isSteering ? computeSteering(axle, spec, d) : undefined;

  const all: Verdict[] = [
    toeVerdict,
    oosVerdict,
    left.camberVerdict,
    right.camberVerdict,
    left.casterVerdict,
    right.casterVerdict,
    left.kpiVerdict,
    right.kpiVerdict,
    ...(steering
      ? [
          steering.tootVerdict,
          steering.steeringBoxVerdict,
          steering.tapeVerdict,
          steering.maxTurnLeftVerdict,
          steering.maxTurnRightVerdict,
        ]
      : []),
  ];

  return {
    id: axle.id,
    index,
    isSteering: axle.isSteering,
    wheelNo: wheelNumbers(index),
    sideDiff,
    cLeft,
    cRight,
    toe,
    toeKind: toe === undefined ? "unknown" : classifyToe(toe),
    toeVerdict,
    oos,
    oosSide: oos === undefined ? "unknown" : outOfSquareSide(oos),
    oosVerdict,
    left,
    right,
    steering,
    status: overallVerdict(all),
  };
}

/** Compute everything for a job. `spec` may be undefined (all bands => unknown). */
export function computeJob(job: Job, spec: SpecProfile | undefined): JobComputed {
  const axles = job.axles.map((a, i) => computeAxle(a, i, spec, job.D));

  // Parallelism of each axle relative to the first (reference) axle.
  const ref = axles[0];
  const parallelism: ParallelismComputed[] = axles.slice(1).map((a) => {
    const value =
      ref?.oos !== undefined && a.oos !== undefined
        ? parallelismDiff(ref.oos, a.oos)
        : undefined;
    return {
      from: ref?.index ?? 0,
      to: a.index,
      value,
      verdict: verdictMax(value, spec?.parallelismMax),
    };
  });

  const status = overallVerdict([
    ...axles.map((a) => ({ status: a.status }) as Verdict),
    ...parallelism.map((p) => p.verdict),
  ]);

  return { axles, parallelism, status };
}
