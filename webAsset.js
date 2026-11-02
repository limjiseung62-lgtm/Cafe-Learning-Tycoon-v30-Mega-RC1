import { webAssets } from './webAssetCatalog.js?v=v30-rc1-f88374ed22e0';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
