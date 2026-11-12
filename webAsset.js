import { webAssets } from './webAssetCatalog.js?v=v31-5d872fe24674';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
