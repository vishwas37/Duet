import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  MoreHorizontal,
  Send,
  Sparkles,
} from 'lucide-react';
import type {
  ChatMessage,
  MatchThread,
  ReportReason,
  UserProfile,
} from '../../types/duet';
import { formatRelativeTime } from '../../utils/matching';
import { EditorialPhoto } from '../EditorialPhoto';
import { SafetyModal } from '../Modals/SafetyModal';

interface ConnectionsViewProps {
  currentUser: UserProfile;
  matches: { thread: MatchThread; partner: UserProfile }[];
  activeMatchId: string | null;
  onSelectMatch: (matchId: string | null) => void;
  messagesByMatch: Record<string, ChatMessage[]>;
  onSendMessage: (match: MatchThread, text: string) => void;
  onUnmatch: (match: MatchThread, partner: UserProfile) => void;
  onBlock: (partner: UserProfile) => void;
  onReport: (
    partner: UserProfile,
    reason: ReportReason,
    details: string,
    alsoBlock: boolean
  ) => void;
  onGoToDiscover: () => void;
}

export function ConnectionsView({
  currentUser,
  matches,
  activeMatchId,
  onSelectMatch,
  messagesByMatch,
  onSendMessage,
  onUnmatch,
  onBlock,
  onReport,
  onGoToDiscover,
}: ConnectionsViewProps) {
  const [draft, setDraft] = useState('');
  const [safetyOpen, setSafetyOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const selectedEntry =
    matches.find((m) => m.thread.id === activeMatchId) ?? null;
  const activeMessages = selectedEntry
    ? messagesByMatch[selectedEntry.thread.id] || []
    : [];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeMessages.length, activeMatchId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEntry || !draft.trim()) return;
    onSendMessage(selectedEntry.thread, draft.trim());
    setDraft('');
  };

  if (matches.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-5 py-16">
        <div className="bg-white border border-[#EAE6DF] rounded-[2rem] p-9 space-y-4">
          <p className="text-xs font-medium text-[#3F6251]">Connections</p>
          <h1 className="font-serif text-4xl text-[#18181B]">
            Conversations begin with mutual intent.
          </h1>
          <p className="text-sm text-[#71717A] leading-relaxed">
            Accept someone in Likes You or send a note on a prompt in Discover to start your first conversation.
          </p>
          <button
            type="button"
            onClick={onGoToDiscover}
            className="inline-flex items-center px-6 py-3 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
          >
            Go to Discover
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto md:px-6 md:py-8 pb-20 md:pb-8">
      <div className="bg-white md:border md:border-[#EAE6DF] md:rounded-[2rem] overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[calc(100vh-8rem)] md:h-[calc(100vh-8.5rem)]">
        {/* Left Pane: Matches List */}
        <aside
          className={`md:col-span-4 border-r border-[#EAE6DF] flex flex-col ${
            selectedEntry ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="px-6 py-5 border-b border-[#EAE6DF]">
            <h1 className="font-serif text-3xl text-[#18181B]">Connections</h1>
            <p className="text-xs text-[#71717A] mt-0.5 tabular-nums">
              {matches.length} mutual {matches.length === 1 ? 'connection' : 'connections'}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-[#F2EFEA]">
            {matches.map(({ thread, partner }) => {
              const isSelected = thread.id === selectedEntry?.thread.id;
              const cover = [...partner.photos].sort((a, b) => a.order - b.order)[0];
              return (
                <button
                  key={thread.id}
                  type="button"
                  onClick={() => onSelectMatch(thread.id)}
                  className={`w-full px-5 py-4 flex items-center gap-3.5 text-left transition-colors ${
                    isSelected ? 'bg-[#EEF3F0]/60' : 'hover:bg-[#FAF9F6]'
                  }`}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden border border-[#EAE6DF] shrink-0">
                    {cover && (
                      <EditorialPhoto
                        photo={cover}
                        displayName={partner.displayName}
                        aspectClass="aspect-square"
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="text-sm font-medium text-[#18181B] truncate">
                        {partner.displayName}
                      </p>
                      <span className="text-[11px] text-[#71717A] tabular-nums shrink-0">
                        {formatRelativeTime(thread.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-[#71717A] truncate mt-0.5">
                      {thread.lastMessageText || 'Matched — start the conversation'}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Right Pane: Real-Time Conversation */}
        <section
          className={`md:col-span-8 flex flex-col bg-[#FAF9F6]/40 ${
            selectedEntry ? 'flex' : 'hidden md:flex'
          }`}
        >
          {selectedEntry ? (
            <>
              {/* Chat Header */}
              <header className="px-5 py-4 bg-white border-b border-[#EAE6DF] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectMatch(null)}
                    aria-label="Back to connections list"
                    className="md:hidden min-w-[40px] min-h-[40px] rounded-full hover:bg-[#FAF9F6] flex items-center justify-center text-[#18181B]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="font-serif text-2xl leading-none text-[#18181B] truncate">
                      {selectedEntry.partner.displayName}, {selectedEntry.partner.age}
                    </h2>
                    <p className="text-xs text-[#71717A] mt-1 truncate">
                      {selectedEntry.partner.pronouns.join(' · ')} ·{' '}
                      {selectedEntry.partner.city}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSafetyOpen(true)}
                  aria-label={`In-chat safety options for ${selectedEntry.partner.displayName}`}
                  className="min-w-[42px] min-h-[42px] rounded-full border border-[#EAE6DF] bg-[#FAF9F6] text-[#71717A] hover:text-[#18181B] flex items-center justify-center"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </header>

              {/* Origin Context Banner */}
              {selectedEntry.thread.originContext && (
                <div className="px-5 py-3.5 bg-[#EEF3F0]/65 border-b border-[#DDE8E1] flex items-start gap-2.5">
                  <Sparkles className="w-4 h-4 text-[#3F6251] shrink-0 mt-0.5" />
                  <div className="text-xs text-[#2C4739] leading-relaxed">
                    <span className="font-medium">
                      Sparked by{' '}
                      {selectedEntry.thread.originContext.targetElementQuestion ||
                        `a ${selectedEntry.thread.originContext.targetElementType}`}
                    </span>
                    {selectedEntry.thread.originContext.targetElementType === 'prompt' &&
                      selectedEntry.thread.originContext.targetElementPreview && (
                        <span className="text-[#456354]">
                          {' '}
                          — “{selectedEntry.thread.originContext.targetElementPreview}”
                        </span>
                      )}
                  </div>
                </div>
              )}

              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3.5">
                {activeMessages.length === 0 ? (
                  <div className="text-center py-12 space-y-2">
                    <MessageCircle className="w-6 h-6 text-[#A1A1AA] mx-auto" />
                    <p className="text-sm text-[#71717A]">
                      Say hello to {selectedEntry.partner.displayName}.
                    </p>
                  </div>
                ) : (
                  activeMessages.map((msg) => {
                    const isMine = msg.senderUid === currentUser.uid;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${
                          isMine ? 'items-end' : 'items-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            isMine
                              ? 'bg-[#3F6251] text-white rounded-br-sm'
                              : 'bg-white border border-[#EAE6DF] text-[#18181B] rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-[11px] text-[#71717A] mt-1 px-1 tabular-nums">
                          {formatRelativeTime(msg.createdAt)}
                          {isMine ? ' · Sent' : ''}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Message Composer */}
              <form
                onSubmit={handleSubmit}
                className="p-4 bg-white border-t border-[#EAE6DF] flex items-center gap-2.5"
              >
                <input
                  type="text"
                  maxLength={1000}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder={`Message ${selectedEntry.partner.displayName}...`}
                  aria-label={`Message ${selectedEntry.partner.displayName}`}
                  className="flex-1 px-4 py-3 rounded-full bg-[#FAF9F6] border border-[#EAE6DF] text-sm text-[#18181B] focus:outline-none focus:border-[#3F6251]"
                />
                <button
                  type="submit"
                  disabled={!draft.trim()}
                  aria-label="Send message"
                  className="min-w-[46px] min-h-[46px] rounded-full bg-[#3F6251] text-white flex items-center justify-center hover:bg-[#345143] disabled:opacity-40 transition-colors shrink-0"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {safetyOpen && (
                <SafetyModal
                  profile={selectedEntry.partner}
                  showUnmatch
                  onClose={() => setSafetyOpen(false)}
                  onUnmatch={() => {
                    onUnmatch(selectedEntry.thread, selectedEntry.partner);
                    setSafetyOpen(false);
                  }}
                  onBlock={() => {
                    onBlock(selectedEntry.partner);
                    setSafetyOpen(false);
                  }}
                  onReport={(reason, details, alsoBlock) => {
                    onReport(selectedEntry.partner, reason, details, alsoBlock);
                    setSafetyOpen(false);
                  }}
                />
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center p-10 text-center">
              <div className="space-y-2 max-w-xs">
                <p className="font-serif text-3xl text-[#18181B]">
                  Select a connection
                </p>
                <p className="text-sm text-[#71717A]">
                  Pick a conversation on the left to read your opening spark and continue talking.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
