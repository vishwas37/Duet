import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const rulesSource = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf8');

test('firestore.rules enforces global default-deny catch-all first', () => {
  assert.match(rulesSource, /match \/\{document=\*\*\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules isolates PII in owner-only userPrivate and locks email_otps completely', () => {
  assert.match(rulesSource, /match \/userPrivate\/\{uid\}[\s\S]*allow get: if isOwner\(uid\) && isValidId\(uid\);[\s\S]*allow list: if false;/);
  assert.match(rulesSource, /match \/email_otps\/\{emailHash\}\s*\{\s*allow read, write: if false;\s*\}/);
});

test('firestore.rules enforces childfree & feminist pledges and 18+ age gate on profiles', () => {
  assert.match(rulesSource, /data\.age is number && data\.age >= 18/);
  assert.match(rulesSource, /data\.childfreePledgeSigned == true/);
  assert.match(rulesSource, /data\.feministQueerPledgeSigned == true/);
});

test('firestore.rules enforces terminal state locking on likes and Master Gate on match messages', () => {
  assert.match(rulesSource, /existing\(\)\.status == 'pending'/);
  assert.match(rulesSource, /incoming\(\)\.diff\(existing\(\)\)\.affectedKeys\(\)\.hasOnly\(\['status'\]\)/);
  assert.match(rulesSource, /exists\(\/databases\/\$\(database\)\/documents\/matches\/\$\(matchId\)\)/);
  assert.match(rulesSource, /allow update, delete: if false;/);
});

test('firestore.rules restricts reports to create-only with enumerated childfree & feminist reasons', () => {
  assert.match(rulesSource, /match \/reports\/\{reportId\}\s*\{\s*allow read, update, delete: if false;/);
  assert.match(rulesSource, /Misrepresented childfree status \/ secretly wants kids/);
  assert.match(rulesSource, /Queerphobia \/ transphobia/);
});
