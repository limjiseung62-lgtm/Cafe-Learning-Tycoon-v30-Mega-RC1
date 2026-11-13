import { webAssets } from './webAssetCatalog.js?v=v31-final-636a93f6f215';
export function webAsset(file) { return webAssets[file]?.file ?? file; }
export { webAssets };
