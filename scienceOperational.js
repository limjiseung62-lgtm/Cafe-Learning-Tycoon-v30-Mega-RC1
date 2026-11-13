/** Exact supplier release/receipt pins; never derived from a save or URL. */
export const scienceOperationalManifest = '6adfd9434e8b23e17ad37e5cab32b8c7255862a4f053e90c06043c96d6327f1f';
export const scienceLegacyManifest = 'ddc0eecaac515e5d2879ededfe95fb0e603fa497de8b84dedc9e8938b0d4703f';
export const scienceOperationalApproval = 'OP-SCIENCE-EXISTING-104-20261031';
export function assertScienceOperational(manifest, runtime) {
    if (manifest !== scienceOperationalManifest || runtime.info.runtimeVersion !== 'common-public-runtime/1.1.2-operational' || runtime.info.operational !== true || runtime.info.operationalApproval !== true || runtime.info.approvalId !== scienceOperationalApproval || runtime.info.engineABIPreserved !== true || runtime.groups.length !== 26)
        throw Error('승인된 과학1.1.2 운영 공급을 확인하지 못했어요. 다른 후보팩으로 바꾸지 않아요.');
}
/** The original 104 objects, references, data ABI and engine ABI were verified equal.
 * Accept only the known legacy record into this verified release, never an unknown pin.
 * Original JSON stays untouched; subsequent normal snapshots use the installed manifest.
 */
export function compatibleCommonManifest(subject, source, target, runtime) {
    if (source === target)
        return true;
    if (subject !== 'science' || source !== scienceLegacyManifest || target !== scienceOperationalManifest)
        return false;
    try {
        assertScienceOperational(target, runtime);
        return true;
    }
    catch {
        return false;
    }
}
