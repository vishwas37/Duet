export type ChildfreeStanceBadge =
  | '100% Firmly Childfree'
  | 'Childfree & Sterilized / Vasectomy'
  | 'DINK Life Enthusiast'
  | 'Childfree Pet Parent';

export interface PhotoItem {
  id: string;
  url: string;
  storagePath: string;
  order: number;
  promptLabel?: string;
  caption?: string;
  isMonogram?: boolean;
  monogramTone?: 'sage' | 'terracotta' | 'plum' | 'charcoal';
}

export interface PromptItem {
  id: string;
  question: string;
  answer: string;
}

export interface DiscoveryPreferences {
  interestedInGenders: string[];
  ageMin: number;
  ageMax: number;
  cities: string[];
  relationshipStyles?: string[];
  prioritizeQueerCommunity: boolean;
}

export interface SafetySettings {
  proactiveIncognitoMode: boolean;
  allowNotesBeforeMatch: boolean;
  pauseProfile: boolean;
}

export interface UserProfile {
  uid: string;
  email: string;
  emailVerifiedViaOtp: boolean;
  displayName: string;
  age: number;
  city: string;
  hometown?: string;
  workOrCraft?: string;

  // Inclusive Identity
  genders: string[];
  showGender: boolean;
  pronouns: string[];
  orientations: string[];
  showOrientation: boolean;
  relationshipStyles: string[];

  // Childfree Verification & Nuance
  childfreePledgeSigned: boolean;
  feministQueerPledgeSigned: boolean;
  childfreeStanceBadge: ChildfreeStanceBadge;
  showSterilizedBadge: boolean;

  // Values & Lifestyle Chips (3 to 8 selected)
  valuesAndLifestyle: string[];

  // Hinge-Style Media & Prompts
  photos: PhotoItem[];
  prompts: PromptItem[];

  // Discovery Preferences & Feminist Safety Settings
  discoveryPreferences: DiscoveryPreferences;
  safetySettings: SafetySettings;

  blockedUids: string[];
  isSample?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TargetElementType = 'photo' | 'prompt' | 'profile';

export interface LikeInteraction {
  id: string;
  fromUid: string;
  toUid: string;
  type: 'like' | 'pass';
  targetElementType?: TargetElementType;
  targetElementId?: string;
  targetElementPreview?: string;
  targetElementQuestion?: string;
  note?: string;
  status: 'pending' | 'matched' | 'dismissed';
  createdAt: number;
}

export interface MatchThread {
  id: string;
  participants: [string, string];
  originContext?: {
    likedByUid: string;
    targetElementType: TargetElementType;
    targetElementPreview: string;
    targetElementQuestion?: string;
    openingNote?: string;
  };
  lastMessageText?: string;
  lastMessageAt: number;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  matchId: string;
  senderUid: string;
  text: string;
  createdAt: number;
}

export type ReportReason =
  | 'Misrepresented childfree status / secretly wants kids'
  | 'Pressuring me to change my mind about children'
  | 'Misogyny, sexism, or disrespecting boundaries'
  | 'Queerphobia / transphobia'
  | 'Harassment or unsolicited explicit content'
  | 'Fake profile / spam';

export interface SafetyReport {
  id: string;
  reporterUid: string;
  reportedUid: string;
  reason: ReportReason;
  details?: string;
  createdAt: number;
}

export type ActiveTab = 'discover' | 'likes' | 'connections' | 'profile';

export interface ToastItem {
  id: string;
  message: string;
  tone?: 'sage' | 'terracotta' | 'neutral';
}
