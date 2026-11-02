import { webAssets } from './webAssetCatalog.js?v=integrated-3bf575d7c25f';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
