import { webAssets } from './webAssetCatalog.js?v=v30-rc1-5973f32a35f5';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
