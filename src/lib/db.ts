/**
 * Local, offline storage (IndexedDB via Dexie).
 *
 * Two tables: `jobs` (measurement sessions) and `specs` (tolerance profiles).
 * The built-in generic spec profiles are seeded on first open.
 */

import Dexie, { type EntityTable } from "dexie";
import type { Job, SpecProfile } from "./types";
import { DEFAULT_SPECS } from "./defaults";

class AlignmentDB extends Dexie {
  jobs!: EntityTable<Job, "id">;
  specs!: EntityTable<SpecProfile, "id">;

  constructor() {
    super("truck-alignment");
    this.version(1).stores({
      // indexes: primary key + fields we query/sort on
      jobs: "id, updatedAt, createdAt, vehicleType",
      specs: "id, vehicleType, name",
    });

    // Seed built-in specs once, on the very first population.
    this.on("populate", async () => {
      await this.specs.bulkAdd(DEFAULT_SPECS);
    });
  }
}

export const db = new AlignmentDB();

/**
 * Make sure the built-in specs exist even for databases created before a given
 * built-in was added (populate only runs on first creation). Safe to call on
 * app start.
 */
export async function ensureBuiltInSpecs(): Promise<void> {
  const existing = await db.specs.bulkGet(DEFAULT_SPECS.map((s) => s.id));
  const missing = DEFAULT_SPECS.filter((_, i) => !existing[i]);
  if (missing.length) await db.specs.bulkPut(missing);
}

// ---- Job helpers ----

export async function saveJob(job: Job): Promise<void> {
  // `job` may be frozen by immer, so write a fresh object rather than mutating.
  await db.jobs.put({ ...job, updatedAt: Date.now() });
}

export async function getJob(id: string): Promise<Job | undefined> {
  return db.jobs.get(id);
}

export async function deleteJob(id: string): Promise<void> {
  await db.jobs.delete(id);
}

/** All jobs, newest first. */
export async function listJobs(): Promise<Job[]> {
  return db.jobs.orderBy("updatedAt").reverse().toArray();
}

// ---- Spec helpers ----

export async function saveSpec(spec: SpecProfile): Promise<void> {
  await db.specs.put(spec);
}

export async function getSpec(id: string | undefined): Promise<SpecProfile | undefined> {
  if (!id) return undefined;
  return db.specs.get(id);
}

export async function deleteSpec(id: string): Promise<void> {
  await db.specs.delete(id);
}

export async function listSpecs(): Promise<SpecProfile[]> {
  return db.specs.orderBy("name").toArray();
}
