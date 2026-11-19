import { QUEER_GENDER_SET, QUEER_ORIENTATION_SET } from '../data/constants';
import type { DiscoveryPreferences, LikeInteraction, UserProfile } from '../types/duet';

export function buildMatchId(uidA: string, uidB: string): string {
  const sorted = [uidA, uidB].sort();
  return `${sorted[0]}__${sorted[1]}`;
}

export function buildLikeId(fromUid: string, toUid: string): string {
  return `${fromUid}__${toUid}`;
}

export function isQueerProfile(profile: Pick<UserProfile, 'orientations' | 'genders' | 'valuesAndLifestyle'>): boolean {
  if (profile.orientations.some((o) => QUEER_ORIENTATION_SET.has(o))) return true;
  if (profile.genders.some((g) => QUEER_GENDER_SET.has(g))) return true;
  if (profile.valuesAndLifestyle.includes('Queer community')) return true;
  return false;
}

export function matchesGenderPreference(
  candidateGenders: string[],
  interestedInGenders: string[]
): boolean {
  if (!interestedInGenders.length || interestedInGenders.includes('Everyone')) {
    return true;
  }

  return candidateGenders.some((gender) => {
    const g = gender.toLowerCase();
    return interestedInGenders.some((pref) => {
      if (pref === 'Women') {
        return g === 'woman' || g === 'trans woman';
      }
      if (pref === 'Men') {
        return g === 'man' || g === 'trans man';
      }
      if (pref === 'Non-binary & Gender-expansive folks') {
        return (
          g === 'non-binary' ||
          g === 'genderqueer' ||
          g === 'genderfluid' ||
          g === 'agender' ||
          g === 'two-spirit' ||
          g === 'questioning' ||
          (g !== 'woman' && g !== 'man')
        );
      }
      if (pref === 'Trans folks') {
        return g.includes('trans') || g === 'non-binary' || g === 'genderqueer';
      }
      return g === pref.toLowerCase();
    });
  });
}

export function getSharedValues(userAValues: string[], userBValues: string[]): string[] {
  const setA = new Set(userAValues);
  return userBValues.filter((v) => setA.has(v));
}

export function isCandidateVisibleToViewer(
  candidate: UserProfile,
  viewerUid: string,
  allLikes: LikeInteraction[]
): boolean {
  if (candidate.safetySettings.pauseProfile) return false;
  if (!candidate.safetySettings.proactiveIncognitoMode) return true;

  // Proactive Incognito Mode: only visible if candidate has already liked the viewer
  return allLikes.some(
    (like) =>
      like.fromUid === candidate.uid &&
      like.toUid === viewerUid &&
      like.type === 'like'
  );
}

export function filterAndRankDiscoverProfiles(params: {
  candidates: UserProfile[];
  currentUser: UserProfile;
  filters: DiscoveryPreferences;
  interactions: LikeInteraction[];
  matchedUids: Set<string>;
}): UserProfile[] {
  const { candidates, currentUser, filters, interactions, matchedUids } = params;
  const blockedSet = new Set(currentUser.blockedUids);
  const actedOnSet = new Set(
    interactions
      .filter((i) => i.fromUid === currentUser.uid)
      .map((i) => i.toUid)
  );

  const filtered = candidates.filter((candidate) => {
    if (candidate.uid === currentUser.uid) return false;
    if (blockedSet.has(candidate.uid)) return false;
    if (candidate.blockedUids.includes(currentUser.uid)) return false;
    if (actedOnSet.has(candidate.uid)) return false;
    if (matchedUids.has(candidate.uid)) return false;
    if (!candidate.childfreePledgeSigned || !candidate.feministQueerPledgeSigned) return false;
    if (!isCandidateVisibleToViewer(candidate, currentUser.uid, interactions)) return false;

    if (candidate.age < filters.ageMin || candidate.age > filters.ageMax) return false;

    if (!matchesGenderPreference(candidate.genders, filters.interestedInGenders)) {
      return false;
    }

    if (filters.cities.length > 0 && !filters.cities.includes(candidate.city)) {
      return false;
    }

    if (
      filters.relationshipStyles &&
      filters.relationshipStyles.length > 0 &&
      !candidate.relationshipStyles.some((s) => filters.relationshipStyles!.includes(s))
    ) {
      return false;
    }

    return true;
  });

  return filtered.sort((a, b) => {
    if (filters.prioritizeQueerCommunity) {
      const aQueer = isQueerProfile(a) ? 1 : 0;
      const bQueer = isQueerProfile(b) ? 1 : 0;
      if (aQueer !== bQueer) return bQueer - aQueer;
    }

    const aShared = getSharedValues(currentUser.valuesAndLifestyle, a.valuesAndLifestyle).length;
    const bShared = getSharedValues(currentUser.valuesAndLifestyle, b.valuesAndLifestyle).length;
    if (aShared !== bShared) return bShared - aShared;

    return b.updatedAt - a.updatedAt;
  });
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function isValidSixDigitOtp(code: string): boolean {
  return /^\d{6}$/.test(code.trim());
}

export function formatRelativeTime(timestamp: number, now: number = Date.now()): string {
  const diffMs = Math.max(0, now - timestamp);
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}
