import { Compass, Heart, MessageCircle, SlidersHorizontal, User } from 'lucide-react';
import type { ActiveTab } from '../types/duet';

interface NavigationProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  pendingLikesCount: number;
  matchesCount: number;
  onOpenFilters: () => void;
  hasActiveFilters: boolean;
}

export function Navigation({
  activeTab,
  onSelectTab,
  pendingLikesCount,
  matchesCount,
  onOpenFilters,
  hasActiveFilters,
}: NavigationProps) {
  const navItems: {
    id: ActiveTab;
    label: string;
    icon: typeof Compass;
    count?: number;
  }[] = [
    { id: 'discover', label: 'Discover', icon: Compass },
    { id: 'likes', label: 'Likes You', icon: Heart, count: pendingLikesCount },
    { id: 'connections', label: 'Connections', icon: MessageCircle, count: matchesCount },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <>
      {/* Desktop Top Bar (3-Zone Editorial Contract) */}
      <header className="hidden md:block sticky top-0 z-30 bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#EAE6DF]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-element serif wordmark */}
          <button
            type="button"
            onClick={() => onSelectTab('discover')}
            className="font-serif text-3xl tracking-tight text-[#18181B] whitespace-nowrap shrink-0 hover:opacity-80 transition-opacity"
          >
            Duet
          </button>

          {/* Zone 2: Clean single-line text navigation */}
          <nav aria-label="Primary navigation" className="flex items-center gap-8">
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onSelectTab(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative py-2 text-sm whitespace-nowrap shrink-0 transition-colors ${
                    isActive
                      ? 'text-[#18181B] font-medium'
                      : 'text-[#71717A] hover:text-[#18181B]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.count !== undefined && item.count > 0 && (
                    <span className="ml-1.5 text-xs tabular-nums text-[#C86D51] font-medium">
                      ({item.count})
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute left-0 right-0 bottom-0 h-[2px] bg-[#3F6251] rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single contextual primary action */}
          <div className="shrink-0">
            <button
              type="button"
              onClick={onOpenFilters}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-colors whitespace-nowrap shrink-0 ${
                hasActiveFilters
                  ? 'bg-[#3F6251] text-white border-[#3F6251] hover:bg-[#345143]'
                  : 'bg-white text-[#18181B] border-[#EAE6DF] hover:border-[#3F6251]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filters
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Compact Header (52px) */}
      <header className="md:hidden sticky top-0 z-30 bg-[#FAF9F6]/92 backdrop-blur-md border-b border-[#EAE6DF] h-[52px] px-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => onSelectTab('discover')}
          className="font-serif text-2xl tracking-tight text-[#18181B] whitespace-nowrap shrink-0"
        >
          Duet
        </button>

        {activeTab === 'discover' ? (
          <button
            type="button"
            onClick={onOpenFilters}
            aria-label="Open discovery filters"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 min-h-[38px] rounded-full text-xs font-medium border whitespace-nowrap shrink-0 ${
              hasActiveFilters
                ? 'bg-[#3F6251] text-white border-[#3F6251]'
                : 'bg-white text-[#18181B] border-[#EAE6DF]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Filters
          </button>
        ) : (
          <span className="text-xs font-medium text-[#71717A] whitespace-nowrap shrink-0">
            {navItems.find((n) => n.id === activeTab)?.label}
          </span>
        )}
      </header>

      {/* Mobile Fixed Bottom Tab Bar (60px -> total sticky 112px <= 15% of 844px) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-[#EAE6DF] h-[60px]"
      >
        <div className="grid grid-cols-4 h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors ${
                  isActive ? 'text-[#3F6251]' : 'text-[#71717A]'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.75} />
                  {item.count !== undefined && item.count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] px-1 rounded-full bg-[#C86D51] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                      {item.count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
