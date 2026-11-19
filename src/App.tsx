import { useCallback, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  createAutostartDemoProfile,
  createInitialSeedIncomingLikes,
  SEED_PROFILES,
} from './data/seedProfiles';
import type {
  ActiveTab,
  ChatMessage,
  DiscoveryPreferences,
  LikeInteraction,
  MatchThread,
  ReportReason,
  ToastItem,
  UserProfile,
} from './types/duet';
import {
  buildLikeId,
  buildMatchId,
  filterAndRankDiscoverProfiles,
} from './utils/matching';
import { auth, googleProvider, isFirebaseConfigured } from './lib/firebase';
import { completePendingEmailLinkSignIn } from './lib/emailOtpService';
import {
  clearLocalState,
  createMatchThreadInCloud,
  deleteMatchInCloud,
  fetchDiscoverableCloudProfiles,
  fetchUserProfileFromCloud,
  isCloudSyncActive,
  loadLocalState,
  persistLikeToCloud,
  saveLocalState,
  saveProfileToCloud,
  sendChatMessageInCloud,
  submitReportToCloud,
  subscribeToCloudMatchMessages,
  undoPassInCloud,
  updateIncomingLikeStatusInCloud,
} from './lib/duetStore';
import { Navigation } from './components/Navigation';
import { ToastContainer } from './components/ToastContainer';
import { OnboardingWizard } from './components/Onboarding/OnboardingWizard';
import { DiscoverView } from './components/Views/DiscoverView';
import { LikesYouView } from './components/Views/LikesYouView';
import { ConnectionsView } from './components/Views/ConnectionsView';
import { ProfileView } from './components/Views/ProfileView';
import { FilterDrawer } from './components/Modals/FilterDrawer';
import type { LikeTargetSelection } from './components/ProfileCardContent';

function initializeState() {
  const params = new URLSearchParams(window.location.search);
  const stored = loadLocalState();

  if (params.get('autostart') === '1' && !stored.currentUser) {
    const demoUser = createAutostartDemoProfile();
    const initialLikes = createInitialSeedIncomingLikes(demoUser.uid, demoUser);
    return {
      currentUser: demoUser,
      likes: initialLikes,
      matches: stored.matches,
      messagesByMatch: stored.messagesByMatch,
      reports: stored.reports,
      seededForUid: demoUser.uid,
    };
  }

  return stored;
}

export default function App() {
  const [initial] = useState(initializeState);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(
    initial.currentUser
  );
  const [likes, setLikes] = useState<LikeInteraction[]>(initial.likes);
  const [matches, setMatches] = useState<MatchThread[]>(initial.matches);
  const [messagesByMatch, setMessagesByMatch] = useState<
    Record<string, ChatMessage[]>
  >(initial.messagesByMatch);
  const [reports, setReports] = useState(initial.reports);
  const [seededForUid, setSeededForUid] = useState<string | undefined>(
    initial.seededForUid
  );
  const [cloudPeers, setCloudPeers] = useState<UserProfile[]>([]);
  const [cloudSynced, setCloudSynced] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<ActiveTab>('discover');
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [passHistory, setPassHistory] = useState<string[]>([]);

  const pushToast = useCallback(
    (message: string, tone: 'sage' | 'terracotta' | 'neutral' = 'neutral') => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      window.setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4200);
    },
    []
  );

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Persist local state smoothly on changes
  useEffect(() => {
    saveLocalState({
      currentUser,
      likes,
      matches,
      messagesByMatch,
      reports,
      seededForUid,
    });
  }, [currentUser, likes, matches, messagesByMatch, reports, seededForUid]);

  // Complete Firebase Email Link callback if returning from link
  useEffect(() => {
    void completePendingEmailLinkSignIn()
      .then((res) => {
        if (res) {
          pushToast(`Verified ${res.email} via email link.`, 'sage');
        }
      })
      .catch(() => {
        // Ignore non-link loads
      });
  }, [pushToast]);

  // Observe Firebase Auth state & load cloud profile/peers when authenticated
  useEffect(() => {
    if (!auth) return;
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      const active = Boolean(fbUser && fbUser.emailVerified);
      setCloudSynced(active);

      if (active && fbUser) {
        void fetchUserProfileFromCloud(fbUser.uid)
          .then((cloudProf) => {
            if (cloudProf) {
              setCurrentUser(cloudProf);
            }
          })
          .catch(() => {
            // Keep local session if rules/offline
          });

        void fetchDiscoverableCloudProfiles(fbUser.uid)
          .then((peers) => setCloudPeers(peers))
          .catch(() => {
            // Ignore peer fetch failures
          });
      }
    });
    return () => unsub();
  }, []);

  // Subscribe to real-time Firestore chat messages for active cloud match
  useEffect(() => {
    if (!currentUser || !activeMatchId || !cloudSynced) return;
    const unsub = subscribeToCloudMatchMessages(
      activeMatchId,
      currentUser.uid,
      (cloudMsgs) => {
        setMessagesByMatch((prev) => ({
          ...prev,
          [activeMatchId]: cloudMsgs,
        }));
      }
    );
    return () => {
      unsub?.();
    };
  }, [activeMatchId, currentUser, cloudSynced]);

  // Combine real Firestore peers with the 6 inclusive Sample Members when < 3 real peers exist
  const allCandidates = useMemo(() => {
    const byUid = new Map<string, UserProfile>();
    cloudPeers.forEach((p) => byUid.set(p.uid, p));
    if (cloudPeers.length < 3) {
      SEED_PROFILES.forEach((p) => {
        if (!byUid.has(p.uid)) byUid.set(p.uid, p);
      });
    }
    return Array.from(byUid.values());
  }, [cloudPeers]);

  const profileLookup = useMemo(() => {
    const map = new Map<string, UserProfile>();
    SEED_PROFILES.forEach((p) => map.set(p.uid, p));
    cloudPeers.forEach((p) => map.set(p.uid, p));
    if (currentUser) map.set(currentUser.uid, currentUser);
    return map;
  }, [cloudPeers, currentUser]);

  const matchedUids = useMemo(() => {
    if (!currentUser) return new Set<string>();
    const set = new Set<string>();
    matches.forEach((m) => {
      const other = m.participants.find((uid) => uid !== currentUser.uid);
      if (other) set.add(other);
    });
    return set;
  }, [matches, currentUser]);

  const discoverQueue = useMemo(() => {
    if (!currentUser) return [];
    return filterAndRankDiscoverProfiles({
      candidates: allCandidates,
      currentUser,
      filters: currentUser.discoveryPreferences,
      interactions: likes,
      matchedUids,
    });
  }, [allCandidates, currentUser, likes, matchedUids]);

  const pendingIncomingLikes = useMemo(() => {
    if (!currentUser) return [];
    const blocked = new Set(currentUser.blockedUids);
    return likes
      .filter(
        (l) =>
          l.toUid === currentUser.uid &&
          l.type === 'like' &&
          l.status === 'pending' &&
          !blocked.has(l.fromUid) &&
          !matchedUids.has(l.fromUid)
      )
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((like) => {
        const sender = profileLookup.get(like.fromUid);
        return sender ? { like, sender } : null;
      })
      .filter((entry): entry is { like: LikeInteraction; sender: UserProfile } =>
        Boolean(entry)
      );
  }, [currentUser, likes, matchedUids, profileLookup]);

  const visibleMatches = useMemo(() => {
    if (!currentUser) return [];
    const blocked = new Set(currentUser.blockedUids);
    return matches
      .filter((m) => {
        const otherUid = m.participants.find((uid) => uid !== currentUser.uid);
        return Boolean(otherUid && !blocked.has(otherUid));
      })
      .sort((a, b) => b.lastMessageAt - a.lastMessageAt)
      .map((thread) => {
        const partnerUid = thread.participants.find((u) => u !== currentUser.uid)!;
        const partner = profileLookup.get(partnerUid);
        return partner ? { thread, partner } : null;
      })
      .filter((entry): entry is { thread: MatchThread; partner: UserProfile } =>
        Boolean(entry)
      );
  }, [currentUser, matches, profileLookup]);

  const handleOnboardingComplete = (profile: UserProfile, isReturning: boolean) => {
    setCurrentUser(profile);

    if (!isReturning && seededForUid !== profile.uid) {
      const starterLikes = createInitialSeedIncomingLikes(profile.uid, profile);
      setLikes((prev) => {
        const existingIds = new Set(prev.map((l) => l.id));
        const additions = starterLikes.filter((l) => !existingIds.has(l.id));
        return [...additions, ...prev];
      });
      setSeededForUid(profile.uid);
    }

    if (isCloudSyncActive(profile.uid)) {
      void saveProfileToCloud(profile).catch(() => {
        // Already surfaced by ErrorBoundary/console
      });
    }

    setActiveTab('discover');
    pushToast(
      isReturning
        ? `Welcome back to Duet, ${profile.displayName}.`
        : 'Profile published. Welcome to Duet.',
      'sage'
    );
  };

  const handleUpdateProfile = (next: UserProfile) => {
    setCurrentUser(next);
    if (isCloudSyncActive(next.uid)) {
      void saveProfileToCloud(next).catch(() => {
        // Logged via handleFirestoreError
      });
    }
  };

  const handleApplyFilters = (nextFilters: DiscoveryPreferences) => {
    if (!currentUser) return;
    handleUpdateProfile({
      ...currentUser,
      discoveryPreferences: nextFilters,
      updatedAt: Date.now(),
    });
    pushToast('Discovery filters updated.', 'sage');
  };

  const handleResetFilters = () => {
    handleApplyFilters({
      interestedInGenders: ['Everyone'],
      ageMin: 21,
      ageMax: 50,
      cities: [],
      relationshipStyles: [],
      prioritizeQueerCommunity: false,
    });
  };

  const handlePass = (targetProfile: UserProfile) => {
    if (!currentUser) return;
    const interaction: LikeInteraction = {
      id: buildLikeId(currentUser.uid, targetProfile.uid),
      fromUid: currentUser.uid,
      toUid: targetProfile.uid,
      type: 'pass',
      status: 'dismissed',
      createdAt: Date.now(),
    };
    setLikes((prev) => [
      ...prev.filter((l) => l.id !== interaction.id),
      interaction,
    ]);
    setPassHistory((prev) => [...prev, targetProfile.uid]);
    void persistLikeToCloud(interaction).catch(() => {});
  };

  const handleUndoPass = () => {
    if (!currentUser || passHistory.length === 0) return;
    const lastUid = passHistory[passHistory.length - 1];
    const likeId = buildLikeId(currentUser.uid, lastUid);
    setPassHistory((prev) => prev.slice(0, -1));
    setLikes((prev) => prev.filter((l) => l.id !== likeId));
    void undoPassInCloud(currentUser.uid, lastUid).catch(() => {});
    pushToast('Restored previous profile.', 'neutral');
  };

  const createMutualMatch = (
    partner: UserProfile,
    origin: MatchThread['originContext'],
    seedMessageSenderUid?: string,
    seedMessageText?: string
  ) => {
    if (!currentUser) return;
    const sorted = [currentUser.uid, partner.uid].sort() as [string, string];
    const matchId = buildMatchId(sorted[0], sorted[1]);
    const now = Date.now();

    const newThread: MatchThread = {
      id: matchId,
      participants: sorted,
      originContext: origin,
      lastMessageText: seedMessageText || undefined,
      lastMessageAt: now,
      createdAt: now,
    };

    setMatches((prev) => {
      const without = prev.filter((m) => m.id !== matchId);
      return [newThread, ...without];
    });

    if (seedMessageText && seedMessageSenderUid) {
      const openingMsg: ChatMessage = {
        id: `msg_open_${now}`,
        matchId,
        senderUid: seedMessageSenderUid,
        text: seedMessageText,
        createdAt: now,
      };
      setMessagesByMatch((prev) => ({
        ...prev,
        [matchId]: [...(prev[matchId] || []), openingMsg],
      }));
    }

    void createMatchThreadInCloud(newThread).catch(() => {});
    return matchId;
  };

  const handleSendLike = (
    targetProfile: UserProfile,
    target: LikeTargetSelection,
    note: string
  ) => {
    if (!currentUser) return;
    const now = Date.now();
    const interaction: LikeInteraction = {
      id: buildLikeId(currentUser.uid, targetProfile.uid),
      fromUid: currentUser.uid,
      toUid: targetProfile.uid,
      type: 'like',
      targetElementType: target.targetElementType,
      targetElementId: target.targetElementId,
      targetElementPreview: target.targetElementPreview,
      targetElementQuestion: target.targetElementQuestion,
      note: note || undefined,
      status: 'pending',
      createdAt: now,
    };

    // Check if they already liked us -> instant mutual match!
    const reciprocal = likes.find(
      (l) =>
        l.fromUid === targetProfile.uid &&
        l.toUid === currentUser.uid &&
        l.type === 'like' &&
        l.status === 'pending'
    );

    if (reciprocal) {
      setLikes((prev) => [
        ...prev.map((l) =>
          l.id === reciprocal.id ? { ...l, status: 'matched' as const } : l
        ),
        { ...interaction, status: 'matched' },
      ]);

      const matchId = createMutualMatch(
        targetProfile,
        {
          likedByUid: currentUser.uid,
          targetElementType: target.targetElementType,
          targetElementPreview: target.targetElementPreview,
          targetElementQuestion: target.targetElementQuestion,
          openingNote: note || reciprocal.note,
        },
        note ? currentUser.uid : reciprocal.note ? targetProfile.uid : undefined,
        note || reciprocal.note || undefined
      );

      void updateIncomingLikeStatusInCloud(reciprocal.id, 'matched').catch(() => {});
      void persistLikeToCloud(interaction).catch(() => {});

      pushToast(`It’s a mutual match with ${targetProfile.displayName}!`, 'sage');
      if (matchId) {
        setActiveMatchId(matchId);
        setActiveTab('connections');
      }
      return;
    }

    setLikes((prev) => [
      ...prev.filter((l) => l.id !== interaction.id),
      interaction,
    ]);
    void persistLikeToCloud(interaction).catch(() => {});
    pushToast(
      note
        ? `Sent your like & note to ${targetProfile.displayName}.`
        : `Liked ${targetProfile.displayName}’s ${target.targetElementType}.`,
      'sage'
    );
  };

  const handleMatchFromLikesYou = (like: LikeInteraction, sender: UserProfile) => {
    if (!currentUser) return;
    setLikes((prev) =>
      prev.map((l) => (l.id === like.id ? { ...l, status: 'matched' } : l))
    );
    void updateIncomingLikeStatusInCloud(like.id, 'matched').catch(() => {});

    const matchId = createMutualMatch(
      sender,
      {
        likedByUid: sender.uid,
        targetElementType: like.targetElementType || 'profile',
        targetElementPreview: like.targetElementPreview || '',
        targetElementQuestion: like.targetElementQuestion,
        openingNote: like.note,
      },
      like.note ? sender.uid : undefined,
      like.note
    );

    if (matchId) {
      setActiveMatchId(matchId);
      setActiveTab('connections');
    }
    pushToast(`Matched with ${sender.displayName}. Conversation opened.`, 'sage');
  };

  const handleDismissIncomingLike = (like: LikeInteraction, sender: UserProfile) => {
    setLikes((prev) =>
      prev.map((l) => (l.id === like.id ? { ...l, status: 'dismissed' } : l))
    );
    void updateIncomingLikeStatusInCloud(like.id, 'dismissed').catch(() => {});
    pushToast(`Dismissed like from ${sender.displayName}.`, 'neutral');
  };

  const handleSendMessage = (match: MatchThread, text: string) => {
    if (!currentUser) return;
    const now = Date.now();
    const newMessage: ChatMessage = {
      id: `msg_${now}_${Math.random().toString(36).slice(2, 6)}`,
      matchId: match.id,
      senderUid: currentUser.uid,
      text,
      createdAt: now,
    };

    setMessagesByMatch((prev) => ({
      ...prev,
      [match.id]: [...(prev[match.id] || []), newMessage],
    }));

    setMatches((prev) =>
      prev.map((m) =>
        m.id === match.id
          ? { ...m, lastMessageText: text, lastMessageAt: now }
          : m
      )
    );

    void sendChatMessageInCloud(match, currentUser.uid, text).catch(() => {});
  };

  const handleUnmatch = (match: MatchThread, partner: UserProfile) => {
    setMatches((prev) => prev.filter((m) => m.id !== match.id));
    if (activeMatchId === match.id) setActiveMatchId(null);
    void deleteMatchInCloud(match.id).catch(() => {});
    pushToast(`Unmatched ${partner.displayName}.`, 'neutral');
  };

  const handleBlock = (targetProfile: UserProfile) => {
    if (!currentUser) return;
    const updatedBlocked = Array.from(
      new Set([...currentUser.blockedUids, targetProfile.uid])
    );
    handleUpdateProfile({
      ...currentUser,
      blockedUids: updatedBlocked,
      updatedAt: Date.now(),
    });
    setMatches((prev) =>
      prev.filter((m) => !m.participants.includes(targetProfile.uid))
    );
    setLikes((prev) =>
      prev.filter(
        (l) => l.fromUid !== targetProfile.uid && l.toUid !== targetProfile.uid
      )
    );
    if (activeMatchId && activeMatchId.includes(targetProfile.uid)) {
      setActiveMatchId(null);
    }
    pushToast(`${targetProfile.displayName} has been blocked and hidden.`, 'terracotta');
  };

  const handleReport = (
    targetProfile: UserProfile,
    reason: ReportReason,
    details: string,
    alsoBlock: boolean
  ) => {
    if (!currentUser) return;
    const report = {
      id: `rep_${Date.now()}`,
      reporterUid: currentUser.uid,
      reportedUid: targetProfile.uid,
      reason,
      details: details.trim() || undefined,
      createdAt: Date.now(),
    };
    setReports((prev) => [report, ...prev]);
    void submitReportToCloud(currentUser.uid, targetProfile.uid, reason, details).catch(
      () => {}
    );
    if (alsoBlock) {
      handleBlock(targetProfile);
    }
    pushToast('Report submitted confidentially. Thank you for keeping Duet safe.', 'sage');
  };

  const handleResetSampleQueue = () => {
    if (!currentUser) return;
    setLikes((prev) =>
      prev.filter(
        (l) => !(l.fromUid === currentUser.uid && l.toUid.startsWith('seed_'))
      )
    );
    setPassHistory([]);
    pushToast('Sample discovery queue refreshed.', 'sage');
  };

  const handleConnectGoogleSync = async () => {
    if (!auth || !currentUser) return;
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const upgraded: UserProfile = {
        ...currentUser,
        uid: cred.user.uid,
        email: cred.user.email || currentUser.email,
        updatedAt: Date.now(),
      };
      setCurrentUser(upgraded);
      setCloudSynced(true);
      await saveProfileToCloud(upgraded);
      pushToast('Cloud Firestore & Storage sync enabled.', 'sage');
    } catch {
      pushToast('Google sign-in was cancelled.', 'neutral');
    }
  };

  const handleSignOut = async () => {
    if (auth?.currentUser) {
      await signOut(auth).catch(() => {});
    }
    clearLocalState();
    setCurrentUser(null);
    setLikes([]);
    setMatches([]);
    setMessagesByMatch({});
    setPassHistory([]);
    setActiveMatchId(null);
    setSeededForUid(undefined);
    pushToast('Signed out of Duet.', 'neutral');
  };

  const hasActiveFilters = Boolean(
    currentUser &&
      (currentUser.discoveryPreferences.cities.length > 0 ||
        !currentUser.discoveryPreferences.interestedInGenders.includes('Everyone') ||
        currentUser.discoveryPreferences.prioritizeQueerCommunity ||
        (currentUser.discoveryPreferences.relationshipStyles?.length ?? 0) > 0)
  );

  if (!currentUser) {
    return (
      <>
        <OnboardingWizard
          existingLocalProfile={initial.currentUser}
          onComplete={handleOnboardingComplete}
          onNotify={pushToast}
        />
        <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#18181B]">
      {!isFirebaseConfigured && (
        <div className="bg-[#EEF3F0] border-b border-[#D5E2DA] px-4 py-2 text-center text-xs text-[#2C4739]">
          Running in local preview mode. Configure <code className="font-mono">VITE_FIREBASE_*</code> in <code className="font-mono">.env</code> to connect your own Firebase project.
        </div>
      )}

      <Navigation
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        pendingLikesCount={pendingIncomingLikes.length}
        matchesCount={visibleMatches.length}
        onOpenFilters={() => setFilterDrawerOpen(true)}
        hasActiveFilters={hasActiveFilters}
      />

      <main>
        {activeTab === 'discover' && (
          <DiscoverView
            currentUser={currentUser}
            queue={discoverQueue}
            filters={currentUser.discoveryPreferences}
            canUndoPass={passHistory.length > 0}
            onPass={handlePass}
            onUndoPass={handleUndoPass}
            onSendLike={handleSendLike}
            onBlock={handleBlock}
            onReport={handleReport}
            onOpenFilters={() => setFilterDrawerOpen(true)}
            onResetFilters={handleResetFilters}
            onResetSampleQueue={handleResetSampleQueue}
          />
        )}

        {activeTab === 'likes' && (
          <LikesYouView
            incomingLikes={pendingIncomingLikes}
            onMatch={handleMatchFromLikesYou}
            onDismiss={handleDismissIncomingLike}
            onGoToDiscover={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'connections' && (
          <ConnectionsView
            currentUser={currentUser}
            matches={visibleMatches}
            activeMatchId={
              activeMatchId ?? visibleMatches[0]?.thread.id ?? null
            }
            onSelectMatch={setActiveMatchId}
            messagesByMatch={messagesByMatch}
            onSendMessage={handleSendMessage}
            onUnmatch={handleUnmatch}
            onBlock={handleBlock}
            onReport={handleReport}
            onGoToDiscover={() => setActiveTab('discover')}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileView
            profile={currentUser}
            cloudSynced={cloudSynced}
            onUpdateProfile={handleUpdateProfile}
            onConnectGoogleSync={() => void handleConnectGoogleSync()}
            onSignOut={() => void handleSignOut()}
            onNotify={pushToast}
          />
        )}
      </main>

      {filterDrawerOpen && (
        <FilterDrawer
          filters={currentUser.discoveryPreferences}
          onApply={handleApplyFilters}
          onClose={() => setFilterDrawerOpen(false)}
        />
      )}

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
