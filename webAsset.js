import { webAssets } from './webAssetCatalog.js?v=v30-rc1-e02fc6e73d9a';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
