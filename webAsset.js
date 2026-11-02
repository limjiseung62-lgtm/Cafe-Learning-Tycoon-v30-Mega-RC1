import { webAssets } from './webAssetCatalog.js?v=furniture-ux-dd837b78b1a8';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
