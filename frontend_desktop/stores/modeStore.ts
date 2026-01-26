import { atom } from 'jotai';

export type Mode = 'Professional' | 'Personal' | 'Counselor';

/**
 * Phase 13: Predictive Cooling
 * Separate from navigation modes: this is an overlay state (low-friction UI)
 * that can be engaged automatically based on system load + intensity.
 */
export type CoolingState = 'off' | 'auto_cooling';

export const modeAtom = atom<Mode>('Professional');
export const coolingStateAtom = atom<CoolingState>('off');

/**
 * Cooling state setter.
 * Updates the root class so CSS can apply low-friction overrides.
 */
export const setCoolingStateAtom = atom(
  null,
  (_get, set, next: CoolingState) => {
    set(coolingStateAtom, next);
    updateCoolingOverlay(next);
  }
);

/**
 * Direct mode setter (used by navigation / routing).
 */
export const setModeAtom = atom(
  null,
  (_get, set, next: Mode) => {
    set(modeAtom, next);

    // Update CSS variables for color palette
    updateColorPalette(next);

    // Sync with backend
    syncModeWithBackend(next);
  }
);

/**
 * Professional ⇄ Personal toggle.
 * (Counselor is entered via explicit navigation, not the toggle)
 */
export const toggleModeAtom = atom(
  null,
  (get, set) => {
    const currentMode = get(modeAtom);
    const newMode: Mode = currentMode === 'Professional' ? 'Personal' : 'Professional';
    set(modeAtom, newMode);

    // Update CSS variables for color palette
    updateColorPalette(newMode);

    // Sync with backend
    syncModeWithBackend(newMode);
  }
);

const updateColorPalette = (mode: Mode) => {
  const root = document.documentElement;

  // Mode-scoped class (used for Counselor safe-space theme)
  root.classList.toggle('mode-counselor', mode === 'Counselor');

  if (mode === 'Professional') {
    // Professional: Slate/Indigo theme
    root.style.setProperty('--primary-color', '#475569');
    root.style.setProperty('--secondary-color', '#4f46e5');
    root.style.setProperty('--background-color', '#f8fafc');
    root.style.setProperty('--surface-color', '#ffffff');
    root.style.setProperty('--text-color', '#1e293b');
    root.style.setProperty('--accent-color', '#6366f1');

    // App theme vars (Tailwind config + base CSS)
    root.style.setProperty('--primary', '#4f46e5');
    root.style.setProperty('--background-dark', '#17191c');
    root.style.setProperty('--panel-dark', '#1e2226');
    root.style.setProperty('--border-dark', '#2c3435');
  } else if (mode === 'Personal') {
    // Personal: Deep Maroon/Gold theme (Scorpio)
    root.style.setProperty('--primary-color', '#7f1d1d');
    root.style.setProperty('--secondary-color', '#d97706');
    root.style.setProperty('--background-color', '#fef7ed');
    root.style.setProperty('--surface-color', '#fff7ed');
    root.style.setProperty('--text-color', '#431407');
    root.style.setProperty('--accent-color', '#dc2626');

    root.style.setProperty('--primary', '#dc2626');
    root.style.setProperty('--background-dark', '#171314');
    root.style.setProperty('--panel-dark', '#201719');
    root.style.setProperty('--border-dark', '#342326');
  } else {
    // Counselor: Lavender & Sage (safe-space)
    root.style.setProperty('--primary-color', '#8b5cf6');
    root.style.setProperty('--secondary-color', '#7fbf9a');
    root.style.setProperty('--background-color', '#f6f4ff');
    root.style.setProperty('--surface-color', '#ffffff');
    root.style.setProperty('--text-color', '#1f2937');
    root.style.setProperty('--accent-color', '#a78bfa');

    root.style.setProperty('--primary', '#a78bfa');
    root.style.setProperty('--background-dark', '#14121a');
    root.style.setProperty('--panel-dark', '#1b1824');
    root.style.setProperty('--border-dark', '#2a2435');
  }
};

const updateCoolingOverlay = (state: CoolingState) => {
  const root = document.documentElement;
  root.classList.toggle('mode-deep-calm', state === 'auto_cooling');
};

const syncModeWithBackend = async (mode: Mode) => {
  try {
    // Tauri command will be implemented later
    console.log(`Mode changed to: ${mode}`);
  } catch (error) {
    console.error('Failed to sync mode with backend:', error);
  }
};
