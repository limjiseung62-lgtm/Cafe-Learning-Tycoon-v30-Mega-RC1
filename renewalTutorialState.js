export const tutorialLevels = [1, 3, 5, 6, 9, 11, 13, 14, 16, 20, 23, 30];
export const tutorialTitles = ['문제풀이·생산·서빙', '직원 고용', '유료 증축', '외관 꾸미기', '직원 교육', '전문화 선택', '보조 서빙대', '직원 담당 구역', '출입구 배치', '대형 매장 운영', '구역 책임자', '프랜차이즈'];
export const newRenewalTutorials = () => ({ version: 1, states: {} });
export function validRenewalTutorials(v) { const t = v; return !!t && t.version === 1 && !!t.states && typeof t.states === 'object' && !Array.isArray(t.states) && Object.entries(t.states).every(([k, v]) => tutorialLevels.some(l => String(l) === k) && typeof v === 'string' && ['complete', 'skipped'].includes(v)) && Object.keys(t).every(k => ['version', 'states'].includes(k)); }
export const pendingTutorials = (s, level) => tutorialLevels.filter(l => l <= level && !s.states[l]);
