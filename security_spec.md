# Duet Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **PII Isolation**: Email addresses and `blockedUids` are stored exclusively in `/userPrivate/{uid}` and are strictly readable/writable only by `request.auth.uid == uid`. `/profiles/{uid}` never stores `email` or `blockedUids`.
2. **Childfree & Consent Gate**: Every profile in `/profiles/{uid}` must have `age >= 18`, `childfreePledgeSigned == true`, `feministQueerPledgeSigned == true`, bounded arrays (`photos.size() <= 6`, `prompts.size() <= 3`, `valuesAndLifestyle.size() <= 8`), and strict field allowlists.
3. **Proactive Incognito Protection**: Listing `/profiles` only returns documents where `resource.data.isDiscoverable == true` or `resource.data.uid == request.auth.uid`, preventing incognito or paused members from being scraped.
4. **Element-Level Likes Integrity**: `/likes/{likeId}` requires `likeId == fromUid + '__' + toUid`, `fromUid == request.auth.uid` on create, `status == 'pending'` on create, and terminal state locking once `status` transitions to `'matched'` or `'dismissed'`. Only `toUid` can transition `status`.
5. **Mutual Match & Chat Master Gate**: `/matches/{matchId}` strictly enforces a 2-participant array; `/matches/{matchId}/messages/{messageId}` verifies parent match membership via `get()` on `create` and `get`, and validates `request.auth.uid in resource.data.participants` on `list`. Messages are immutable.
6. **Server-Only OTP Vault**: `/email_otps/{emailHash}` denies all client read/write operations (`if false`).
7. **Create-Only Safety Reports**: `/reports/{reportId}` allows authenticated create with strictly enumerated childfree/feminist safety reasons and denies all client reads, updates, and deletes.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Shadow Field Injection on Profile**: Creating `/profiles/{uid}` with extra field `{ isAdmin: true }`.
2. **Underage Profile Bypass**: Creating `/profiles/{uid}` with `{ age: 17 }`.
3. **Unpledged Profile Bypass**: Creating `/profiles/{uid}` with `{ childfreePledgeSigned: false }`.
4. **PII Snooping**: User B attempting `get` on `/userPrivate/{userA}`.
5. **Incognito Scraping**: User B attempting `list` on `/profiles` without filtering `isDiscoverable == true`.
6. **Spoofed Like Author**: User A creating `/likes/{userB}__userC` with `fromUid: userB`.
7. **State Shortcutting on Like**: User A creating a like already marked `status: 'matched'`.
8. **Terminal State Overwrite**: User B updating a `'dismissed'` like back to `'matched'`.
9. **Chat Intrusion**: Non-participant User C creating a message inside `/matches/{userA__userB}/messages/{msgId}`.
10. **Value Poisoning on Match**: Participant updating `lastMessageText` with a 5,000-character string or changing `participants`.
11. **Report Tampering / Reading**: User A attempting to `read` or `delete` `/reports/{reportId}`.
12. **OTP Vault Access**: Any client attempting to `read` or `write` `/email_otps/{emailHash}`.
