import { webAssets } from './webAssetCatalog.js?v=sq-approved400-20261104';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
