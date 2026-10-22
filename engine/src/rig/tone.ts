import { createContext, useContext } from 'react';

/**
 * The toned look (What's the Catch?, look 2, picked by Biku on 2026-10-22 after the study of
 * Kurzgesagt in knowledge/playbooks/kurzgesagt-study.md): filled shapes have no outline, each is
 * drawn in tones of its own colour, a shadow on the side away from the light and a lit edge on
 * the side toward it. Limbs stay lines, as they are what a stick figure is made of. Off unless a
 * picture turns it on with `<TonedContext.Provider value>`, so every other look is unchanged.
 */
export const TonedContext = createContext(false);

export const useToned = () => useContext(TonedContext);

/** How much lighter the lit edge of a toned shape is than its colour. */
export const TONED_LIGHT = 0.3;
