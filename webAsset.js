import { webAssets } from './webAssetCatalog.js?v=stability-97670d28ea8d';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
