import { finalCharacterAssets } from './finalCharacterAssets.js?v=v31-final-636a93f6f215';
const registry = new Map(finalCharacterAssets.map(a => [a.kind === 'staff' ? a.id : a.visualKey, a]));
export const finalActorIds = () => [...registry.keys()];
export const hasFinalActor = (id) => registry.has(id);
export function finalActorFrame(id, direction, action, phase = 0) { const a = registry.get(id); if (!a)
    return undefined; const index = action === 'walk' ? 1 + Math.abs(Math.floor(phase)) % 2 : action === 'carry' || action === 'sit' ? 3 : 0; return a.frames[direction][index]; }
export const finalActorDetails = (id) => registry.get(id);
