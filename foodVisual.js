import { sprite } from './art.js?v=v31-5d872fe24674';
export function foodVisual(menu) { return '<span class="food-art star-' + menu.currentLevel + '" role="img" aria-label="' + menu.name + ' ' + menu.currentLevel + '성">' + sprite(menu.visualKey) + (menu.currentLevel > 1 ? '<small class="food-grade">' + "★".repeat(menu.currentLevel) + '</small>' : '') + '</span>'; }
