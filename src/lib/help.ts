/**
 * Field help text, drawn straight from the JOSAM laser AM manual. Keyed so the
 * editor can attach a "?" explainer to each input. Kept short and practical —
 * what to read off the device and where.
 */

export interface HelpText {
  title: string;
  body: string;
  /** Manual page reference. */
  ref?: string;
}

export const HELP = {
  D: {
    title: "Distance between scales (D)",
    body: "Measure the distance, in metres, between the front frame-gauge scale (A) and the rear frame-gauge scale (B). One value is used for the whole vehicle. Example in the manual: D = 6 m.",
    ref: "Manual p.26",
  },
  A: {
    title: "Front scale reading (A)",
    body: "Aim the laser dot at the FRONT measuring scale for this wheel and read the value in mm. Left wheel → scale A1, right wheel → scale A2. Example: 158.",
    ref: "Manual p.26, 40",
  },
  B: {
    title: "Rear scale reading (B)",
    body: "Aim the laser dot at the REAR measuring scale for this wheel and read the value in mm. Left wheel → scale B1, right wheel → scale B2. Example: 151.",
    ref: "Manual p.26, 40",
  },
  camber: {
    title: "Camber",
    body: "Lean of the wheel viewed from the front. Upper part leaning OUT = positive (+), leaning IN = negative (−). Measure with the AM301 gauge, axle level and wheel loaded on the floor. Degrees and minutes.",
    ref: "Manual p.36, 45",
  },
  caster: {
    title: "Caster",
    body: "Fore/aft tilt of the kingpin seen from the side. Upper part leaning BACK = positive (+), forward = negative (−). Turn the wheel 20° out then 20° in with the turn plates and read on the AM301. Steering axle only.",
    ref: "Manual p.46–49",
  },
  kpi: {
    title: "KPI — kingpin inclination",
    body: "Inward lean of the kingpin seen from the front/back. Always positive. Turn 20° out then 20° in and read the difference on the AM301. Axle must be level and the brake engaged. Steering axle only.",
    ref: "Manual p.50–53",
  },
  turnReference: {
    title: "Turn — reference angle",
    body: "The angle you turn the INNER wheel to on the turn-angle gauge (AM135), usually 20°. Read the outer wheel on the opposite side.",
    ref: "Manual p.54",
  },
  turnOuter: {
    title: "Turn — outer wheel",
    body: "With the inner wheel held at the reference angle, read the angle of the OUTER wheel on the opposite turn-angle gauge. The toe-out on turn is reference − outer. Left and right must not differ by more than 0.5°.",
    ref: "Manual p.54",
  },
  maxTurn: {
    title: "Maximum turn",
    body: "Turn the wheel out as far as it goes and read the maximum lock angle on the turn-angle gauge. Compare left and right against the manufacturer's spec. Steering axle only.",
    ref: "Manual p.55",
  },
  steeringBox: {
    title: "Steering-box centering",
    body: "With the steering box on its centre mark, aim the laser at the front scale (A) then the rear scale (B) and read both. Deviation (A−B)/D must be ≤ 1°/m (≈17.4 mm/m).",
    ref: "Manual p.38–39",
  },
  tape: {
    title: "Out of square by tape",
    body: "With a tape measure, measure from the spring eye to a common reference (e.g. the U-bolt hole) on each side. Left and right must not differ by more than 5 mm.",
    ref: "Manual p.44",
  },
  toe: {
    title: "Toe",
    body: "Computed from both wheels. Positive = toe-in (front of wheels closer), negative = toe-out. Set by the manufacturer's spec.",
    ref: "Manual p.20, 37",
  },
  outOfSquare: {
    title: "Out of square",
    body: "How far the axle sits off the vehicle centreline. Positive = offset to the left, negative = to the right. Half the difference of the two wheels' rolling direction.",
    ref: "Manual p.30, 34",
  },
} as const;

export type HelpKey = keyof typeof HELP;
