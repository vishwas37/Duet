import { useState } from 'react';
import { RotateCcw, X } from 'lucide-react';
import {
  CITY_QUICK_PICKS,
  DISCOVERY_GENDER_GROUPS,
  RELATIONSHIP_STYLE_OPTIONS,
} from '../../data/constants';
import type { DiscoveryPreferences } from '../../types/duet';

interface FilterDrawerProps {
  filters: DiscoveryPreferences;
  onApply: (next: DiscoveryPreferences) => void;
  onClose: () => void;
}

export function FilterDrawer({ filters, onApply, onClose }: FilterDrawerProps) {
  const [draft, setDraft] = useState<DiscoveryPreferences>({
    ...filters,
    relationshipStyles: filters.relationshipStyles || [],
  });

  const toggleGender = (group: string) => {
    if (group === 'Everyone') {
      setDraft((prev) => ({ ...prev, interestedInGenders: ['Everyone'] }));
      return;
    }
    setDraft((prev) => {
      const cleaned = prev.interestedInGenders.filter((g) => g !== 'Everyone');
      const exists = cleaned.includes(group);
      const next = exists ? cleaned.filter((g) => g !== group) : [...cleaned, group];
      return {
        ...prev,
        interestedInGenders: next.length === 0 ? ['Everyone'] : next,
      };
    });
  };

  const toggleCity = (city: string) => {
    setDraft((prev) => {
      const exists = prev.cities.includes(city);
      return {
        ...prev,
        cities: exists ? prev.cities.filter((c) => c !== city) : [...prev.cities, city],
      };
    });
  };

  const toggleRelationship = (style: string) => {
    setDraft((prev) => {
      const current = prev.relationshipStyles || [];
      const exists = current.includes(style);
      return {
        ...prev,
        relationshipStyles: exists
          ? current.filter((s) => s !== style)
          : [...current, style],
      };
    });
  };

  const handleReset = () => {
    setDraft({
      interestedInGenders: ['Everyone'],
      ageMin: 21,
      ageMax: 50,
      cities: [],
      relationshipStyles: [],
      prioritizeQueerCommunity: false,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Discovery filters"
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/45 backdrop-blur-xs p-0 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white border border-[#EAE6DF] rounded-t-[2rem] md:rounded-[2rem] p-6 md:p-7 shadow-xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 mb-6">
          <h2 className="font-serif text-3xl text-[#18181B]">Discovery Filters</h2>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-[#71717A] hover:text-[#18181B] hover:bg-[#FAF9F6]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close filters"
              className="min-w-[40px] min-h-[40px] rounded-full hover:bg-[#FAF9F6] flex items-center justify-center text-[#71717A]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Who you want to meet */}
          <div>
            <p className="text-xs font-medium text-[#71717A] mb-2.5">Who you want to meet</p>
            <div className="flex flex-wrap gap-2">
              {DISCOVERY_GENDER_GROUPS.map((group) => {
                const active = draft.interestedInGenders.includes(group);
                return (
                  <button
                    key={group}
                    type="button"
                    onClick={() => toggleGender(group)}
                    className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-[#3F6251] text-white border-[#3F6251]'
                        : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF] hover:border-[#3F6251]'
                    }`}
                  >
                    {group}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prioritize Queer Community */}
          <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F6F1F6]/70 border border-[#E5D9E6] cursor-pointer">
            <div>
              <p className="text-sm font-medium text-[#583C59]">
                Prioritize Queer Community
              </p>
              <p className="text-xs text-[#71717A] mt-0.5">
                Surface queer, trans, and gender-expansive childfree members first.
              </p>
            </div>
            <input
              type="checkbox"
              checked={draft.prioritizeQueerCommunity}
              onChange={(e) =>
                setDraft((prev) => ({
                  ...prev,
                  prioritizeQueerCommunity: e.target.checked,
                }))
              }
              className="w-5 h-5 accent-[#6D4C6E] shrink-0"
            />
          </label>

          {/* Cities */}
          <div>
            <p className="text-xs font-medium text-[#71717A] mb-2.5">
              Cities {draft.cities.length === 0 ? '(All Cities)' : `(${draft.cities.length} selected)`}
            </p>
            <div className="flex flex-wrap gap-2">
              {CITY_QUICK_PICKS.map((city) => {
                const active = draft.cities.includes(city);
                return (
                  <button
                    key={city}
                    type="button"
                    onClick={() => toggleCity(city)}
                    className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-[#3F6251] text-white border-[#3F6251]'
                        : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF] hover:border-[#3F6251]'
                    }`}
                  >
                    {city}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Relationship Structure */}
          <div>
            <p className="text-xs font-medium text-[#71717A] mb-2.5">
              Relationship Structure
            </p>
            <div className="flex flex-wrap gap-2">
              {RELATIONSHIP_STYLE_OPTIONS.map((style) => {
                const active = (draft.relationshipStyles || []).includes(style);
                return (
                  <button
                    key={style}
                    type="button"
                    onClick={() => toggleRelationship(style)}
                    className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                      active
                        ? 'bg-[#3F6251] text-white border-[#3F6251]'
                        : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF] hover:border-[#3F6251]'
                    }`}
                  >
                    {style}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Age Range */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-[#71717A]">Age Range</p>
              <span className="text-xs font-medium text-[#18181B] tabular-nums">
                {draft.ageMin} – {draft.ageMax}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="filter-age-min" className="block text-[11px] text-[#71717A] mb-1">
                  Minimum (18+)
                </label>
                <input
                  id="filter-age-min"
                  type="number"
                  min={18}
                  max={draft.ageMax}
                  value={draft.ageMin}
                  onChange={(e) => {
                    const val = Math.max(18, Math.min(draft.ageMax, Number(e.target.value) || 18));
                    setDraft((prev) => ({ ...prev, ageMin: val }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm tabular-nums focus:outline-none focus:border-[#3F6251]"
                />
              </div>
              <div>
                <label htmlFor="filter-age-max" className="block text-[11px] text-[#71717A] mb-1">
                  Maximum
                </label>
                <input
                  id="filter-age-max"
                  type="number"
                  min={draft.ageMin}
                  max={85}
                  value={draft.ageMax}
                  onChange={(e) => {
                    const val = Math.max(draft.ageMin, Math.min(85, Number(e.target.value) || 45));
                    setDraft((prev) => ({ ...prev, ageMax: val }));
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm tabular-nums focus:outline-none focus:border-[#3F6251]"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-7 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-full border border-[#EAE6DF] text-sm font-medium text-[#52525B] hover:bg-[#FAF9F6]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="flex-[1.5] py-3 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
