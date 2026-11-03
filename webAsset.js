import { webAssets } from './webAssetCatalog.js?v=commerce-6afe2d573839';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
