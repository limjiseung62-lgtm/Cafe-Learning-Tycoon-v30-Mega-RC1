import { webAssets } from './webAssetCatalog.js?v=kitchen-707cb8cb607b';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
