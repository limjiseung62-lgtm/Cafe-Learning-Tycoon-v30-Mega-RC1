import { webAssets } from './webAssetCatalog.js?v=v30-rc1-5bf787ba0cb4';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
