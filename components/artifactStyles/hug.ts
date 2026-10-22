"use client";

import { createContext, useContext } from "react";

/**
 * Whether the artifact being drawn hugs its content (its height follows what
 * it draws) rather than filling a box. Bodies that clamp prose to the height
 * they are given read it: in a hugging card there is nothing to clamp to, and
 * measuring themselves would only feed back on their own height. Set by the
 * Artifact Studio stage and by the Frost canvas pack (components/frost).
 */
export const HugContext = createContext(false);
export const useHugs = () => useContext(HugContext);
