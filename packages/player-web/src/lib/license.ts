/**
 * Personal copies on the device (§3.4). A purchased course names its buyer. The player opens it fully for that
 * buyer — offline, from what is already on the device — and for anyone else shows the first lesson and a way to
 * buy their own copy. This keeps honest people honest; it is not, and cannot be, a lock.
 */
import { copyStatus, type CopyStatus, type Manifest } from '@tome/core';
import { account, anonymousId, useAccount } from './account.ts';
import { owns, useEntitlements } from './entitlements.ts';

export const knownSubjects = () => [account()?.id, anonymousId()].filter((s): s is string => !!s);
export const statusOf = (m: Manifest): CopyStatus => copyStatus(m, knownSubjects(), owns(m.id));

/** Re-evaluates when the learner signs in or buys. */
export function useCopyStatus(m: Manifest | undefined): CopyStatus {
  useEntitlements(); useAccount();
  return m ? statusOf(m) : 'unlicensed';
}

/** Lessons a non-owner may read: the first one, as a preview. */
export const previewLessons = 1;
