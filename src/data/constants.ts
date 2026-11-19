import type { ChildfreeStanceBadge, ReportReason } from '../types/duet';

export const GENDER_OPTIONS = [
  'Woman',
  'Man',
  'Non-binary',
  'Trans Woman',
  'Trans Man',
  'Genderqueer',
  'Genderfluid',
  'Agender',
  'Two-Spirit',
  'Questioning',
] as const;

export const PRONOUN_OPTIONS = [
  'she/her',
  'he/him',
  'they/them',
  'she/they',
  'he/they',
  'ze/zir',
] as const;

export const ORIENTATION_OPTIONS = [
  'Queer',
  'Bisexual',
  'Pansexual',
  'Lesbian',
  'Gay',
  'Straight',
  'Asexual',
  'Demisexual',
  'Aromantic',
  'Polysexual',
  'Questioning',
] as const;

export const DISCOVERY_GENDER_GROUPS = [
  'Everyone',
  'Women',
  'Non-binary & Gender-expansive folks',
  'Men',
  'Trans folks',
] as const;

export const RELATIONSHIP_STYLE_OPTIONS = [
  'Monogamous',
  'Ethical Non-Monogamy (ENM)',
  'Polyamorous',
  'Open to exploring',
  'Queerplatonic / Life Partnership',
] as const;

export const CITY_QUICK_PICKS = [
  'Bengaluru',
  'Mumbai',
  'Delhi NCR',
  'Hyderabad',
  'Pune',
  'Chennai',
  'Kolkata',
  'Goa',
] as const;

export const CHILDFREE_STANCE_OPTIONS: ChildfreeStanceBadge[] = [
  '100% Firmly Childfree',
  'Childfree & Sterilized / Vasectomy',
  'DINK Life Enthusiast',
  'Childfree Pet Parent',
];

export const VALUES_AND_LIFESTYLE_OPTIONS = [
  'Intersectional feminist',
  'Queer community',
  'Therapy-positive',
  'Equal emotional labor',
  'FIRE / Financial independence',
  'Slow travel',
  'Pet parent',
  'Quiet Sundays',
  'Creative pursuits',
  'Outdoors & nature',
  'Left-leaning / Progressive',
  'Sober / Low-alcohol',
  'Neurodivergent-friendly',
  'Independent cinema',
  'Plant-based / Mindful eating',
  'Mutual aid & community',
] as const;

export const PHOTO_PROMPT_LABELS = [
  "A weekend I'd repeat forever",
  'Me in my element',
  'My happy place',
  'My pet / creative side',
  'Sunday morning ritual',
  'Caught in good light',
  'A corner of my world',
] as const;

export interface PromptCategory {
  category: string;
  prompts: string[];
}

export const CURATED_PROMPT_CATEGORIES: PromptCategory[] = [
  {
    category: 'Childfree Joy',
    prompts: [
      'My favorite thing about the childfree life is...',
      'A freedom I refuse to give up is...',
      'Our ideal quiet Sunday looks like...',
      'The best thing about answering to no school-run schedule is...',
    ],
  },
  {
    category: 'Values & Emotional Depth',
    prompts: [
      'Green flags I look for in a partner...',
      'Equal partnership to me means...',
      'Unlearning patriarchy taught me...',
      'What enthusiastic consent and emotional safety feel like to me...',
    ],
  },
  {
    category: 'Play & Curiosity',
    prompts: [
      'A rabbit hole I could talk about for hours...',
      'Next passport stamp on my mind...',
      'The way to win me over is...',
      'A book, film, or album that rewired how I see the world...',
    ],
  },
];

export const ALL_CURATED_PROMPTS: string[] = CURATED_PROMPT_CATEGORIES.flatMap(
  (c) => c.prompts
);

export const REPORT_REASONS: ReportReason[] = [
  'Misrepresented childfree status / secretly wants kids',
  'Pressuring me to change my mind about children',
  'Misogyny, sexism, or disrespecting boundaries',
  'Queerphobia / transphobia',
  'Harassment or unsolicited explicit content',
  'Fake profile / spam',
];

export const QUEER_ORIENTATION_SET = new Set([
  'Queer',
  'Bisexual',
  'Pansexual',
  'Lesbian',
  'Gay',
  'Asexual',
  'Demisexual',
  'Aromantic',
  'Polysexual',
  'Questioning',
]);

export const QUEER_GENDER_SET = new Set([
  'Non-binary',
  'Trans Woman',
  'Trans Man',
  'Genderqueer',
  'Genderfluid',
  'Agender',
  'Two-Spirit',
  'Questioning',
]);
