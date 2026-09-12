import { create } from "zustand";

/**
 * Tracks the single active YouTube playback session on the canvas. A video
 * cell starts a session when the user hits play; the CanvasVideoPlayerLayer
 * owns one iframe for that session and moves it (never reparents it) between a
 * "docked" position over the node and a floating corner PiP when the node
 * scrolls out of view. Only one session is active at a time.
 */
export interface VideoPipSession {
  /** Stable id of the video cell that owns playback (React useId). */
  sessionId: string;
  /** Parsed YouTube video id. */
  videoId: string;
  title: string;
  /** Owning artifact — lets the PiP "expand" control refocus the node. */
  artifactId?: string;
}

interface VideoPipState {
  active: VideoPipSession | null;
  play: (session: VideoPipSession) => void;
  stop: () => void;
}

export const useVideoPipStore = create<VideoPipState>((set) => ({
  active: null,
  play: (session) => set({ active: session }),
  stop: () => set({ active: null }),
}));
