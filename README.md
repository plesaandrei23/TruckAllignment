# TruckAlign — JOSAM AM39 alignment

A phone-first, offline app that turns the raw readings printed by the **JOSAM laser AM**
measuring rig into a computed, pass/fail **AM39 alignment report** for trucks and trailers.

You type what the manual device shows on its scales; the app does every calculation, flags
each value against a reusable tolerance profile, and renders a faithful AM39 sheet you can
print or save as PDF. Everything is stored locally on the device and works with no network.

## What it computes

For every wheel you enter the front scale reading **A**, the rear scale reading **B**, and
once per vehicle the distance **D** (metres) between the scales:

| Result | Formula | Meaning |
| --- | --- | --- |
| Rolling direction `C/Dm` | `(A − B) / D` mm/m | how each wheel points |
| Toe | `C_left + C_right` | **+** toe-in · **−** toe-out |
| Out of square | `(C_right − C_left) / 2` | **+** axle offset left · **−** right |
| Axle parallelism | `oos_axle1 − oos_axleN` | 0 = parallel |
| Angle ↔ mm/m | `1° = 17.4 mm/m` | for manufacturer specs in degrees |

The **steering (front) axle** of a truck additionally captures camber, caster, KPI,
toe-out-on-turn, maximum turn, steering-box centering and tape out-of-square.

All formulas are verified against the worked examples in the JOSAM manual — see
`src/lib/calc.test.ts` and `src/lib/compute.test.ts`.

## Pass / fail

Good/bad comes from a **spec profile** (`Tolerance profiles` in the app). Two generic
built-ins ship pre-seeded; duplicate one and enter your manufacturer’s exact figures. The
three limits fixed by the manual are pre-filled: steering-box centering ≤ 1°/m (≈17.4 mm/m),
toe-out-on-turn side difference ≤ 0.5°, tape out-of-square ≤ 5 mm.

## Tech

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind v4** + **shadcn/ui** (Base UI)
- **Dexie / IndexedDB** — local, offline job & profile storage
- **Serwist** — installable, offline PWA (service worker + manifest)
- **Vitest** — calculation & report render tests
- Native browser **print → A4 portrait PDF** (no heavy dependencies)

## Develop

```bash
npm install
npm run dev      # http://localhost:3000  (webpack — Serwist needs it)
npm test         # calculation + report tests
npm run build    # production build
```

> Dev uses `--webpack` because the Serwist service worker is bundled with webpack; the
> service worker is disabled in development and only registers in production.

## Structure

```
src/lib/calc.ts        pure calculation engine (unit-tested against the manual)
src/lib/compute.ts     Job + SpecProfile -> computed values + verdicts
src/lib/verdict.ts     value vs tolerance -> pass / fail / unknown
src/lib/db.ts          Dexie schema + helpers
src/lib/defaults.ts    blank job/axle factories + built-in spec profiles
src/app/                home, /job/[id] editor, /job/[id]/report, /specs
src/components/report/  faithful AM39 sheet (truck & trailer variants)
```
