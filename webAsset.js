import { webAssets } from './webAssetCatalog.js?v=v30-rc1-0dab56eed3a7';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
