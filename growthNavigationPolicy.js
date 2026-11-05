/** Modern city navigation replaces the retired village routes; saved assets remain intact. */
export function modernCityNavigation(deployment = typeof document === 'undefined' ? '' : document.querySelector('meta[name="cafe-deployment"]')?.getAttribute('content') ?? '') {
    return ['v30e-city-integrated-local', 'v30e-common-local', 'v30e-v31-local'].includes(deployment);
}
