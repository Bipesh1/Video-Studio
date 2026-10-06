import { createContext } from 'react';

/**
 * A character facing left is drawn mirrored. Anything inside it that must not read backward,
 * such as a question mark over the head, reads this to flip itself back: 1 when the character
 * faces right, -1 when it faces left.
 */
export const MirrorContext = createContext<1 | -1>(1);
