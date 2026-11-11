import { webAssets } from './webAssetCatalog.js?v=mega-d152ad969955';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
