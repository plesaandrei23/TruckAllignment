/**
 * A fully-filled demo job so a new user can immediately see how the app works
 * and what a finished report looks like. Numbers are the JOSAM manual's own
 * worked examples (front axle C1/C2 p.40, drive axles C3–C6 p.32/26), plus
 * realistic steering-geometry readings.
 */

import type { Job } from "./types";
import { defaultSpecId } from "./defaults";

function uid(): string {
  return crypto.randomUUID();
}

export function makeDemoJob(): Job {
  const now = Date.now();
  return {
    id: uid(),
    createdAt: now,
    updatedAt: now,
    vehicleType: "truck",
    header: {
      regNo: "DEMO-123",
      type: "Volvo FH 6×2 (demo)",
      owner: "Example Haulage Ltd",
      date: new Date(now).toISOString().slice(0, 10),
      milesKm: "412 000",
      sign: "A. Tester",
      notes: "Sample data from the JOSAM manual — safe to delete.",
    },
    D: 6,
    specProfileId: defaultSpecId("truck"),
    axles: [
      {
        id: uid(),
        isSteering: true,
        // C1 = (158-151)/6 = +1.17 ; C2 = (140-154)/6 = -2.33  -> toe-out
        left: {
          A: 158,
          B: 151,
          camber: { deg: 0, min: 20, sign: 1 },
          caster: { deg: 2, min: 30, sign: 1 },
          kpi: { deg: 6, min: 0, sign: 1 },
        },
        right: {
          A: 140,
          B: 154,
          camber: { deg: 0, min: 15, sign: 1 },
          caster: { deg: 2, min: 24, sign: 1 },
          kpi: { deg: 6, min: 10, sign: 1 },
        },
        steering: {
          turnLeft: { reference: 20, opposite: 18 },
          turnRight: { reference: 20, opposite: 18 },
          maxTurnLeft: 40,
          maxTurnRight: 39,
          steeringBoxA: 115,
          steeringBoxB: 118,
          tapeLeft: 865,
          tapeRight: 860,
        },
      },
      {
        id: uid(),
        isSteering: false,
        // C3 = (89-113)/6 = -4 ; C4 = (108-96)/6 = +2  -> toe-out, oos left
        left: { A: 89, B: 113, camber: { deg: 0, min: 10, sign: 1 } },
        right: { A: 108, B: 96, camber: { deg: 0, min: 5, sign: -1 } },
      },
      {
        id: uid(),
        isSteering: false,
        // C5 = (110-92)/6 = +3 ; C6 = (96-108)/6 = -2  -> toe-in, oos right
        left: { A: 110, B: 92, camber: { deg: 0, min: 8, sign: 1 } },
        right: { A: 96, B: 108, camber: { deg: 0, min: 12, sign: 1 } },
      },
    ],
  };
}
