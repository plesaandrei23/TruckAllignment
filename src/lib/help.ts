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
  runout: {
    title: "Run-out compensation",
    body: "Jack the axle up. Aim the laser at the scale with the projector parallel to the adjustment arm and read the value (Start, e.g. 95). Spin the wheel half a turn and read again (Half turn, e.g. 55). Trim the white knob until the dot sits midway between the two — 75 here. Then turn the wheel a quarter turn and trim the black knob to that same value. Spin and check the dot no longer wanders.",
    ref: "Manual p.13",
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

/** Romanian help text (same keys as HELP). */
export const HELP_RO: Record<HelpKey, HelpText> = {
  D: {
    title: "Distanța dintre rigle (D)",
    body: "Măsoară distanța, în metri, dintre rigla față (A) și rigla spate (B) ale cadrului. O singură valoare pentru tot vehiculul. Exemplu din manual: D = 6 m.",
    ref: "Manual pag. 26",
  },
  runout: {
    title: "Compensarea bătăii",
    body: "Ridică axa pe cric. Îndreaptă laserul spre riglă cu proiectorul paralel cu brațul de reglaj și citește valoarea (Start, ex. 95). Rotește roata o jumătate de tură și citește din nou (Jumătate de tură, ex. 55). Reglează din butonul alb până când punctul cade exact la mijloc între cele două — 75 aici. Apoi rotește roata un sfert de tură și reglează din butonul negru la aceeași valoare. Rotește și verifică să nu mai „fugă” punctul.",
    ref: "Manual p.13",
  },
  A: {
    title: "Citirea riglei față (A)",
    body: "Îndreaptă punctul laser spre rigla FAȚĂ a acestei roți și citește valoarea în mm. Roata stânga → rigla A1, roata dreapta → rigla A2. Exemplu: 158.",
    ref: "Manual pag. 26, 40",
  },
  B: {
    title: "Citirea riglei spate (B)",
    body: "Îndreaptă punctul laser spre rigla SPATE a acestei roți și citește valoarea în mm. Roata stânga → rigla B1, roata dreapta → rigla B2. Exemplu: 151.",
    ref: "Manual pag. 26, 40",
  },
  camber: {
    title: "Camber (unghi de cădere)",
    body: "Înclinarea roții văzută din față. Partea de sus înclinată în AFARĂ = pozitiv (+), spre INTERIOR = negativ (−). Se măsoară cu aparatul AM301, axa la nivel și roata încărcată pe sol. Grade și minute.",
    ref: "Manual pag. 36, 45",
  },
  caster: {
    title: "Caster (unghi de fugă)",
    body: "Înclinarea față/spate a pivotului văzută din lateral. Partea de sus înclinată SPATE = pozitiv (+), față = negativ (−). Rotește roata 20° în afară, apoi 20° înăuntru cu platourile și citește pe AM301. Doar axă directoare.",
    ref: "Manual pag. 46–49",
  },
  kpi: {
    title: "KPI — înclinare pivot",
    body: "Înclinarea spre interior a pivotului văzută din față/spate. Întotdeauna pozitivă. Rotește 20° în afară, apoi 20° înăuntru și citește diferența pe AM301. Axa la nivel și frâna acționată. Doar axă directoare.",
    ref: "Manual pag. 50–53",
  },
  turnReference: {
    title: "Viraj — unghi de referință",
    body: "Unghiul la care rotești roata INTERIOARĂ pe aparatul de unghi (AM135), de obicei 20°. Citește roata exterioară de pe partea opusă.",
    ref: "Manual pag. 54",
  },
  turnOuter: {
    title: "Viraj — roata exterioară",
    body: "Cu roata interioară ținută la unghiul de referință, citește unghiul roții EXTERIOARE pe aparatul opus. Diferența la viraj = referință − exterioară. Stânga și dreapta nu trebuie să difere cu mai mult de 0,5°.",
    ref: "Manual pag. 54",
  },
  maxTurn: {
    title: "Viraj maxim",
    body: "Rotește roata cât de mult se poate și citește unghiul maxim de blocaj pe aparatul de unghi. Compară stânga cu dreapta față de specificația producătorului. Doar axă directoare.",
    ref: "Manual pag. 55",
  },
  steeringBox: {
    title: "Centrare casetă direcție",
    body: "Cu caseta de direcție pe reperul central, îndreaptă laserul spre rigla față (A), apoi spre rigla spate (B) și citește-le pe amândouă. Abaterea (A−B)/D trebuie să fie ≤ 1°/m (≈17,4 mm/m).",
    ref: "Manual pag. 38–39",
  },
  tape: {
    title: "Abatere măsurată cu ruleta",
    body: "Cu o ruletă, măsoară de la ochiul arcului la un reper comun (ex. gaura bridei) pe fiecare parte. Stânga și dreapta nu trebuie să difere cu mai mult de 5 mm.",
    ref: "Manual pag. 44",
  },
  toe: {
    title: "Convergență",
    body: "Calculată din ambele roți. Pozitiv = convergență (fața roților mai apropiată), negativ = divergență. Stabilită de specificația producătorului.",
    ref: "Manual pag. 20, 37",
  },
  outOfSquare: {
    title: "Abatere de la perpendicular",
    body: "Cât de mult stă axa în afara axei longitudinale a vehiculului. Pozitiv = deplasare spre stânga, negativ = spre dreapta. Jumătate din diferența direcțiilor de rulare ale celor două roți.",
    ref: "Manual pag. 30, 34",
  },
};

export function helpFor(lang: "en" | "ro", topic: HelpKey): HelpText {
  return lang === "ro" ? HELP_RO[topic] : HELP[topic];
}
