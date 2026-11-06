import { webAssets } from './webAssetCatalog.js?v=backup-p0-b5b501b25d27';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
