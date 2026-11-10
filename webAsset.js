import { webAssets } from './webAssetCatalog.js?v=mega-5d509fb5dbfc';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
