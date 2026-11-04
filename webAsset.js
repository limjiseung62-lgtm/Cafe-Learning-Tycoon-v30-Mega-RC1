import { webAssets } from './webAssetCatalog.js?v=placement-ea9474dcb7f1';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
