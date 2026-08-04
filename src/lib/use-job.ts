"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { produce, type WritableDraft } from "immer";
import type { Job } from "./types";
import { getJob, saveJob } from "./db";

type Recipe = (draft: WritableDraft<Job>) => void;

/**
 * Loads a job once, keeps an editable copy in React state, and autosaves
 * (debounced) to IndexedDB after edits. Mutations are written with immer, so
 * callers just mutate the draft.
 */
export function useJobEditor(id: string) {
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const dirty = useRef(false);

  useEffect(() => {
    let live = true;
    getJob(id).then((j) => {
      if (!live) return;
      setJob(j ?? null);
      setLoading(false);
    });
    return () => {
      live = false;
    };
  }, [id]);

  const update = useCallback((recipe: Recipe) => {
    dirty.current = true;
    setJob((prev) => (prev ? produce(prev, recipe) : prev));
  }, []);

  // Debounced autosave whenever the job changes after an edit.
  useEffect(() => {
    if (!job || !dirty.current) return;
    const t = setTimeout(() => {
      void saveJob(job);
    }, 400);
    return () => clearTimeout(t);
  }, [job]);

  // Best-effort flush on unmount.
  useEffect(() => {
    return () => {
      if (job && dirty.current) void saveJob(job);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { job, loading, update, setJob };
}
