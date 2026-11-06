import { webAssets } from './webAssetCatalog.js?v=level-seats-83d02b666a1c';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
