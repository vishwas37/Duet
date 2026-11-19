import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildLikeId,
  buildMatchId,
  filterAndRankDiscoverProfiles,
  getSharedValues,
  isCandidateVisibleToViewer,
  isQueerProfile,
  isValidEmail,
  isValidSixDigitOtp,
  matchesGenderPreference,
} from './matching';
import { createAutostartDemoProfile, SEED_PROFILES } from '../data/seedProfiles';
import type { LikeInteraction } from '../types/duet';

test('buildMatchId produces deterministic sorted match IDs', () => {
  assert.equal(buildMatchId('uid_b', 'uid_a'), 'uid_a__uid_b');
  assert.equal(buildMatchId('uid_a', 'uid_b'), 'uid_a__uid_b');
  assert.equal(buildLikeId('from_1', 'to_2'), 'from_1__to_2');
});

test('email and 6-digit OTP validators accept valid input and reject malformed input', () => {
  assert.equal(isValidEmail('nisha@duet.community'), true);
  assert.equal(isValidEmail('not-an-email'), false);
  assert.equal(isValidSixDigitOtp('482910'), true);
  assert.equal(isValidSixDigitOtp('48291'), false);
  assert.equal(isValidSixDigitOtp('48a910'), false);
});

test('matchesGenderPreference supports inclusive categories accurately', () => {
  assert.equal(matchesGenderPreference(['Trans Woman', 'Woman'], ['Women']), true);
  assert.equal(matchesGenderPreference(['Non-binary'], ['Non-binary & Gender-expansive folks']), true);
  assert.equal(matchesGenderPreference(['Man'], ['Women']), false);
  assert.equal(matchesGenderPreference(['Genderfluid'], ['Everyone']), true);
});

test('proactiveIncognitoMode hides profiles unless they liked the viewer first', () => {
  const incognitoCandidate = {
    ...SEED_PROFILES[0],
    safetySettings: { ...SEED_PROFILES[0].safetySettings, proactiveIncognitoMode: true },
  };

  assert.equal(isCandidateVisibleToViewer(incognitoCandidate, 'viewer_1', []), false);

  const incomingLike: LikeInteraction = {
    id: `${incognitoCandidate.uid}__viewer_1`,
    fromUid: incognitoCandidate.uid,
    toUid: 'viewer_1',
    type: 'like',
    status: 'pending',
    createdAt: Date.now(),
  };

  assert.equal(isCandidateVisibleToViewer(incognitoCandidate, 'viewer_1', [incomingLike]), true);
});

test('filterAndRankDiscoverProfiles enforces blocks, city, age, relationship style, and queer priority', () => {
  const me = createAutostartDemoProfile();
  me.blockedUids = ['seed_rohan_del'];

  const rankedQueerFirst = filterAndRankDiscoverProfiles({
    candidates: SEED_PROFILES,
    currentUser: me,
    filters: {
      interestedInGenders: ['Everyone'],
      ageMin: 24,
      ageMax: 40,
      cities: [],
      prioritizeQueerCommunity: true,
    },
    interactions: [],
    matchedUids: new Set(),
  });

  assert.equal(rankedQueerFirst.some((p) => p.uid === 'seed_rohan_del'), false);
  assert.equal(isQueerProfile(rankedQueerFirst[0]), true);

  const mumbaiOnly = filterAndRankDiscoverProfiles({
    candidates: SEED_PROFILES,
    currentUser: me,
    filters: {
      interestedInGenders: ['Everyone'],
      ageMin: 24,
      ageMax: 40,
      cities: ['Mumbai'],
      prioritizeQueerCommunity: false,
    },
    interactions: [],
    matchedUids: new Set(),
  });

  assert.equal(mumbaiOnly.length, 1);
  assert.equal(mumbaiOnly[0].displayName, 'Meera');
});

test('getSharedValues returns overlapping lifestyle tags in candidate order', () => {
  const shared = getSharedValues(
    ['Intersectional feminist', 'Quiet Sundays', 'Slow travel'],
    ['Creative pursuits', 'Quiet Sundays', 'Intersectional feminist']
  );
  assert.deepEqual(shared, ['Quiet Sundays', 'Intersectional feminist']);
});
