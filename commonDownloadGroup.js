const generations = new WeakMap();
/** Keep the latest files per report type; saved files and learning archives are untouched. */
export async function replaceDownloadGroup(host, group, items, readerFactory = () => new FileReader()) {
    let slots = generations.get(host);
    if (!slots)
        generations.set(host, slots = new Map());
    const generation = (slots.get(group) ?? 0) + 1;
    slots.set(group, generation);
    const urls = await Promise.all(items.map(item => new Promise((resolve, reject) => { const reader = readerFactory(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(Error('결과 파일을 준비하지 못했어요. 다시 저장해 주세요.')); reader.onabort = () => reject(Error('결과 파일 준비가 취소됐어요.')); reader.readAsDataURL(item.blob); })));
    if (slots.get(group) !== generation)
        return;
    const anchors = items.map((item, i) => { const a = host.ownerDocument.createElement('a'); a.href = urls[i]; a.download = item.filename; a.textContent = item.filename + ' · 파일 저장'; a.className = 'secondary'; a.dataset.downloadGroup = group; return a; });
    for (const old of host.querySelectorAll('a[download]'))
        if (old.dataset.downloadGroup === group)
            old.remove();
    for (const a of anchors) {
        host.append(a);
        a.click();
    }
}
