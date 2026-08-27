"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ro";

/**
 * Lightweight i18n. Keys are the English source strings, so `t("Next")` returns
 * the Romanian when the language is "ro" and a translation exists, otherwise the
 * English source. Works without a provider (defaults to English) so the report
 * component can be rendered in tests.
 */

const RO: Record<string, string> = {
  // app shell / home
  "TruckAlign": "TruckAlign",
  "JOSAM AM39 alignment": "Aliniere JOSAM AM39",
  "Search reg no, owner, type…": "Caută nr. înmatriculare, proprietar, tip…",
  "New measurement": "Măsurătoare nouă",
  "No measurements yet": "Nicio măsurătoare încă",
  "Start a new measurement to record axle readings and build a report — or load a demo to see how it works.":
    "Începe o măsurătoare nouă pentru a înregistra citirile pe axe și a genera un raport — sau încarcă un exemplu ca să vezi cum funcționează.",
  "Load demo measurement": "Încarcă exemplu demonstrativ",
  "No matches": "Niciun rezultat",
  "Try a different search.": "Încearcă altă căutare.",
  "Open report": "Deschide raportul",
  "Delete": "Șterge",
  "Measurement deleted": "Măsurătoare ștearsă",
  "Demo measurement created": "Exemplu demonstrativ creat",
  "What are you measuring?": "Ce măsori?",
  "Pick the vehicle so the right report is used.": "Alege vehiculul pentru a folosi raportul potrivit.",
  "Truck": "Camion",
  "Truck 8×4": "Camion 8×4",
  "Trailer": "Remorcă",
  "Steering front axle + up to 2 more": "Axă față directoare + încă maxim 2",
  "2 steering axles + 2 more": "2 axe directoare + încă 2",
  "Up to 4 axles": "Până la 4 axe",
  // built-in profile names
  "Generic Truck": "Camion generic",
  "Truck 8×4 (2 steering)": "Camion 8×4 (2 axe directoare)",
  "Generic Trailer": "Remorcă generică",
  "axles": "axe",
  "Untitled vehicle": "Vehicul fără nume",
  "Actions": "Acțiuni",
  "Spec profiles": "Profiluri de toleranță",

  // new-measurement dialog
  "Licence plate": "Număr de înmatriculare",
  "The rest of the details are filled in after measuring.": "Restul datelor se completează după măsurare.",
  "Start measuring": "Începe măsurarea",
  "Steering axle — add more later": "Axă directoare — adaugi altele mai târziu",
  "2 steering axles": "2 axe directoare",

  // measuring workflow
  "Run-out compensation": "Compensarea bătăii",
  "step 1": "pasul 1",
  "step 2": "pasul 2",
  "step 3": "pasul 3",
  "Read the scale, spin the wheel half a turn and read again. Trim the adapter until the dot sits on the target.":
    "Citește rigla, rotește roata o jumătate de tură și citește din nou. Reglează adaptorul până când punctul cade pe țintă.",
  "Start": "Start",
  "Half turn": "Jumătate de tură",
  "Adjust to": "Reglează la",
  "Run-out": "Bătaie",
  "Measure": "Măsurare",
  "saved": "salvate",
  "Save first reading": "Salvează prima măsurătoare",
  "Save reading after adjustment": "Salvează măsurătoarea după reglaj",
  "The values above are what the report prints.": "Valorile de mai sus sunt cele tipărite în raport.",
  "Reading saved": "Măsurătoare salvată",
  "front": "față",
  "rear": "spate",
  "FRONT": "FAȚĂ",
  "Centre the steering": "Centrarea direcției",
  "With the steering box on its centre mark, read the same wheel on both scales. Max 1°/m (≈ 17.4 mm/m).":
    "Cu caseta de direcție pe reperul de centru, citește aceeași roată pe ambele rigle. Maxim 1°/m (≈ 17,4 mm/m).",
  "Deviation": "Abatere",
  "Only the axles you are aligning. The rest stay blank on the report.":
    "Doar axele pe care le reglezi. Restul rămân necompletate în raport.",

  // readings log
  "Readings": "Măsurători",
  "Finish": "Finalizare",
  "No readings saved yet": "Nicio măsurătoare salvată",
  "Save a reading on an axle before and after the mechanic adjusts, and both show up here.":
    "Salvează câte o măsurătoare înainte și după reglajul mecanicului și apar amândouă aici.",
  "Workshop record only — none of this is printed on the report.":
    "Doar evidență de atelier — nimic din toate acestea nu apare în raport.",
  "Before adjustment": "Înainte de reglaj",
  "After adjustment": "După reglaj",
  "On the report": "În raport",
  "Restore": "Restaurează",
  "Reading restored": "Măsurătoare restaurată",

  // finish
  "Report details": "Date pentru raport",
  "These fill in the header of the AM39 sheet.": "Acestea completează antetul fișei AM39.",

  // setup
  "Vehicle": "Vehicul",
  "Reg. no": "Nr. înmatriculare",
  "Type / model": "Tip / model",
  "Owner": "Proprietar",
  "Date": "Dată",
  "More details": "Mai multe detalii",
  "Order no": "Nr. comandă",
  "Miles / km": "Mile / km",
  "Signed by": "Semnat de",
  "Notes": "Observații",
  "Measurement setup": "Configurare măsurătoare",
  "Distance between scales (D)": "Distanța dintre rigle (D)",
  "Distance between the front and rear frame gauges. Shared by every axle.":
    "Distanța dintre riglele față și spate ale cadrului. Comună tuturor axelor.",
  "Nothing is computed until D is set. Decimals are fine — 6.5 or 6,5.":
    "Nu se calculează nimic până nu setezi D. Zecimalele sunt acceptate — 6.5 sau 6,5.",
  "Set the distance D on the Setup step to see computed results.":
    "Setează distanța D la pasul Configurare pentru a vedea rezultatele calculate.",
  "Tolerance profile": "Profil de toleranță",
  "Profile": "Profil",
  "Choose a spec profile": "Alege un profil",
  "Decides which readings pass or fail.": "Stabilește ce citiri trec sau pică.",
  "Axles": "Axe",
  "Axle": "Axă",
  "steering": "directoare",
  "Steering": "Directoare",
  "Add axle": "Adaugă axă",
  "Remove axle": "Elimină axa",

  // axle step
  "Left wheel": "Roată stânga",
  "Right wheel": "Roată dreapta",
  "Front scale (A)": "Riglă față (A)",
  "Rear scale (B)": "Riglă spate (B)",
  "Camber": "Camber",
  "Record camber": "Înregistrează camber",
  "Caster": "Caster",
  "KPI": "KPI",
  "Steering geometry": "Geometrie direcție",
  "optional": "opțional",
  "Toe-out on turn": "Diferență la viraj",
  "Turn inner wheel to a reference angle, read the outer wheel. Sides should differ by ≤ 0.5°.":
    "Rotește roata interioară la un unghi de referință, citește roata exterioară. Diferența dintre părți ≤ 0,5°.",
  "Maximum turn": "Viraj maxim",
  "Left lock": "Blocaj stânga",
  "Right lock": "Blocaj dreapta",
  "Steering-box centering": "Centrare casetă direcție",
  "Deviation must be ≤ 1°/m (≈ 17.4 mm/m).": "Abaterea trebuie să fie ≤ 1°/m (≈ 17,4 mm/m).",
  "Out of square (tape)": "Abatere (ruletă)",
  "Left vs right spring-eye distance. Max difference 5 mm.":
    "Distanța ochi-arc stânga vs dreapta. Diferență maximă 5 mm.",
  "Enter a number, e.g. 6.5": "Introdu un număr, de ex. 6,5",
  "Left": "Stânga",
  "Right": "Dreapta",
  "Left · reference": "Stânga · referință",
  "Left · outer": "Stânga · exterioară",
  "Right · reference": "Dreapta · referință",
  "Right · outer": "Dreapta · exterioară",

  // live readout / review
  "Left C/Dm": "C/Dm stânga",
  "Right C/Dm": "C/Dm dreapta",
  "A − B": "A − B",
  "Left − Right": "Stânga − Dreapta",
  "Toe": "Convergență",
  "toe-out": "divergență",
  "toe-in": "convergență",
  "Toe-in": "Convergență",
  "Toe-out": "Divergență",
  "Neutral": "Neutru",
  "Out of square": "Abatere",
  "right": "dreapta",
  "left": "stânga",
  "Centred": "Centrat",
  "Within tolerance": "În toleranță",
  "Out of tolerance": "În afara toleranței",
  "Not enough data yet": "Date insuficiente",
  "Checked against": "Verificat față de",
  "No tolerance profile selected": "Niciun profil de toleranță selectat",
  "Toe-out on turn Δ": "Δ diferență la viraj",
  "Steering box": "Casetă direcție",
  "Tape out of square": "Abatere (ruletă)",
  "Axle parallelism": "Paralelism axe",
  "Each axle compared with axle 1 (0 = parallel).": "Fiecare axă comparată cu axa 1 (0 = paralel).",
  "Open AM39 report": "Deschide raportul AM39",
  "Camber L": "Camber S",
  "Camber R": "Camber D",
  "Caster L": "Caster S",
  "Caster R": "Caster D",
  "KPI L": "KPI S",
  "KPI R": "KPI D",

  // editor nav
  "Back": "Înapoi",
  "Next": "Înainte",
  "Report": "Raport",
  "Setup": "Configurare",
  "Review": "Sumar",
  "Loading…": "Se încarcă…",
  "Not found": "Negăsit",
  "This measurement no longer exists.": "Această măsurătoare nu mai există.",
  "Back to measurements": "Înapoi la măsurători",
  "Something went wrong": "A apărut o eroare",
  "Your measurements are saved on this device. Try again, or go back and reopen it.":
    "Măsurătorile sunt salvate pe acest dispozitiv. Încearcă din nou sau întoarce-te și redeschide-o.",
  "Try again": "Reîncearcă",

  // report toolbar
  "AM39 report": "Raport AM39",
  "The AM39 sheet is always issued in English.": "Fișa AM39 se emite întotdeauna în engleză.",
  "Print / PDF": "Printează / PDF",
  "Report not found.": "Raportul nu a fost găsit.",
  "Tip: in the print dialog choose “Save as PDF”. Colours must be enabled to keep the pass/fail shading.":
    "Sfat: în dialogul de printare alege „Salvează ca PDF”. Culorile trebuie activate pentru a păstra marcajele trecut/picat.",

  // specs
  "Tolerance profiles": "Profiluri de toleranță",
  "Decide what passes and fails": "Stabilește ce trece și ce pică",
  "A profile holds the allowed range for each measurement. Duplicate a built-in and enter your manufacturer’s figures.":
    "Un profil conține intervalul permis pentru fiecare măsurătoare. Duplică unul predefinit și introdu valorile producătorului.",
  "New profile": "Profil nou",
  "New tolerance profile": "Profil de toleranță nou",
  "Trucks": "Camioane",
  "Trailers": "Remorci",
  "built-in": "predefinit",
  "Untitled profile": "Profil fără nume",
  "Profile name": "Nume profil",
  "All axles": "Toate axele",
  "Steering axle": "Axă directoare",
  "Changes save automatically.": "Modificările se salvează automat.",
  "Cancel": "Anulează",
  "Delete this profile?": "Ștergi acest profil?",
  "Jobs already using it keep their results. This can’t be undone.":
    "Măsurătorile care îl folosesc deja își păstrează rezultatele. Acțiunea nu poate fi anulată.",
  "This profile no longer exists.": "Acest profil nu mai există.",
  "Back to profiles": "Înapoi la profiluri",
  "Profile duplicated": "Profil duplicat",
  "Profile deleted": "Profil șters",

  // verdict
  "OK": "OK",
  "Out": "Depășit",

  // report body labels
  "OUT OF TOLERANCE": "ÎN AFARA TOLERANȚEI",
  "WITHIN TOLERANCE": "ÎN TOLERANȚĂ",
  "INCOMPLETE": "INCOMPLET",
  "MAX TURN": "VIRAJ MAXIM",
  "OUT OF SQUARE": "ABATERE DE LA PERPENDICULAR",
  "TOE-OUT ON TURN": "DIFERENȚĂ LA VIRAJ",
  // report header field labels
  "Order N°": "Nr. comandă",
  "Reg. N°": "Nr. înmatr.",
  "Type": "Tip",
  "Miles/Km": "Km",
  "Sign": "Semnătură",
  "Notes-r": "Observații",
  // per-axle toe result (matches geometrieTir xls)
  "Result": "Rezultat",
  "TOE-IN": "CONVERGENȚĂ",
  "TOE-OUT": "DIVERGENȚĂ",
  "EQUAL": "EGAL",
};

const DICTS: Record<Lang, Record<string, string>> = { en: {}, ro: RO };

interface I18nValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (s: string) => string;
}

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (s) => s,
});

const STORAGE_KEY = "truckalign-lang";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    // Read the saved language after mount to avoid an SSR/hydration mismatch.
    const saved = typeof localStorage !== "undefined" ? (localStorage.getItem(STORAGE_KEY) as Lang | null) : null;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved === "en" || saved === "ro") setLangState(saved);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* ignore */
    }
  };

  const t = (s: string) => DICTS[lang][s] ?? s;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/** Translate with a specific language (for server/test rendering of the report). */
export function translate(lang: Lang, s: string): string {
  return DICTS[lang][s] ?? s;
}
