import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  HeartHandshake,
  Loader2,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import { signInWithPopup } from 'firebase/auth';
import {
  ALL_CURATED_PROMPTS,
  CHILDFREE_STANCE_OPTIONS,
  CITY_QUICK_PICKS,
  CURATED_PROMPT_CATEGORIES,
  DISCOVERY_GENDER_GROUPS,
  GENDER_OPTIONS,
  ORIENTATION_OPTIONS,
  PRONOUN_OPTIONS,
  RELATIONSHIP_STYLE_OPTIONS,
  VALUES_AND_LIFESTYLE_OPTIONS,
} from '../../data/constants';
import type {
  ChildfreeStanceBadge,
  PhotoItem,
  PromptItem,
  UserProfile,
} from '../../types/duet';
import {
  sendEmailOtp,
  verifyEmailOtp,
  type DevOtpPreviewMessage,
} from '../../lib/emailOtpService';
import { auth, googleProvider } from '../../lib/firebase';
import { fetchUserProfileFromCloud } from '../../lib/duetStore';
import { isValidEmail } from '../../utils/matching';
import { DevOtpInboxDrawer } from '../DevOtpInboxDrawer';
import { PhotoStudio } from '../PhotoStudio';
import { ProfileCardContent } from '../ProfileCardContent';

interface OnboardingWizardProps {
  existingLocalProfile: UserProfile | null;
  onComplete: (profile: UserProfile, isReturning: boolean) => void;
  onNotify: (message: string, tone?: 'sage' | 'terracotta' | 'neutral') => void;
}

type StanceChoice = 'childfree' | 'unsure' | 'wants_kids' | null;

export function OnboardingWizard({
  existingLocalProfile,
  onComplete,
  onNotify,
}: OnboardingWizardProps) {
  const [step, setStep] = useState<number>(1);

  // Step 1: Childfree Gatekeeper & Pledges
  const [stance, setStance] = useState<StanceChoice>(null);
  const [childfreePledge, setChildfreePledge] = useState(false);
  const [feministPledge, setFeministPledge] = useState(false);

  // Step 2: Passwordless Email OTP
  const [email, setEmail] = useState('');
  const [otpStage, setOtpStage] = useState<'email' | 'code'>('email');
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [otpBusy, setOtpBusy] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [devOtpPreview, setDevOtpPreview] = useState<DevOtpPreviewMessage | null>(null);
  const [verifiedUid, setVerifiedUid] = useState<string>('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Step 3: Identity, Pronouns, Orientation, Relationship
  const [displayName, setDisplayName] = useState('');
  const [age, setAge] = useState<string>('29');
  const [pronouns, setPronouns] = useState<string[]>(['she/her']);
  const [customPronoun, setCustomPronoun] = useState('');
  const [genders, setGenders] = useState<string[]>(['Woman']);
  const [customGender, setCustomGender] = useState('');
  const [showGender, setShowGender] = useState(true);
  const [orientations, setOrientations] = useState<string[]>(['Queer']);
  const [customOrientation, setCustomOrientation] = useState('');
  const [showOrientation, setShowOrientation] = useState(true);
  const [relationshipStyles, setRelationshipStyles] = useState<string[]>(['Monogamous']);
  const [step3Error, setStep3Error] = useState('');

  // Step 4: Location, Vitals & Discovery Preferences
  const [city, setCity] = useState('Bengaluru');
  const [customCity, setCustomCity] = useState('');
  const [hometown, setHometown] = useState('');
  const [workOrCraft, setWorkOrCraft] = useState('');
  const [interestedInGenders, setInterestedInGenders] = useState<string[]>(['Everyone']);
  const [ageMin, setAgeMin] = useState(24);
  const [ageMax, setAgeMax] = useState(40);
  const [prioritizeQueerCommunity, setPrioritizeQueerCommunity] = useState(false);

  // Step 5: Photo Studio
  const [photos, setPhotos] = useState<PhotoItem[]>([]);

  // Step 6: Prompts, Values, Stance Badge
  const [prompts, setPrompts] = useState<PromptItem[]>([
    { id: 'pr_1', question: CURATED_PROMPT_CATEGORIES[0].prompts[0], answer: '' },
    { id: 'pr_2', question: CURATED_PROMPT_CATEGORIES[1].prompts[1], answer: '' },
    { id: 'pr_3', question: CURATED_PROMPT_CATEGORIES[2].prompts[0], answer: '' },
  ]);
  const [valuesAndLifestyle, setValuesAndLifestyle] = useState<string[]>([
    'Intersectional feminist',
    'Therapy-positive',
    'Quiet Sundays',
  ]);
  const [childfreeStanceBadge, setChildfreeStanceBadge] =
    useState<ChildfreeStanceBadge>('100% Firmly Childfree');
  const [showSterilizedBadge, setShowSterilizedBadge] = useState(false);
  const [step6Error, setStep6Error] = useState('');

  // Step 7: Consent Controls
  const [proactiveIncognitoMode, setProactiveIncognitoMode] = useState(false);
  const [allowNotesBeforeMatch, setAllowNotesBeforeMatch] = useState(true);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setInterval(() => {
      setResendSeconds((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendSeconds]);

  const toggleMulti = (
    list: string[],
    value: string,
    setter: (next: string[]) => void,
    max = 6
  ) => {
    if (list.includes(value)) {
      setter(list.filter((item) => item !== value));
    } else if (list.length < max) {
      setter([...list, value]);
    }
  };

  const addCustomChip = (
    rawValue: string,
    list: string[],
    setter: (next: string[]) => void,
    clearInput: () => void,
    max = 6
  ) => {
    const trimmed = rawValue.trim();
    if (!trimmed) return;
    if (!list.includes(trimmed) && list.length < max) {
      setter([...list, trimmed]);
    }
    clearInput();
  };

  const handleSendOtp = async () => {
    setOtpError('');
    if (!isValidEmail(email)) {
      setOtpError('Please enter a valid email address.');
      return;
    }
    setOtpBusy(true);
    try {
      const result = await sendEmailOtp(email);
      setOtpStage('code');
      setOtpDigits(['', '', '', '', '', '']);
      setResendSeconds(60);
      if (result.devPreview) {
        setDevOtpPreview(result.devPreview);
      } else if (result.mode === 'firebase-email-link') {
        onNotify('Check your email for your passwordless Duet sign-in link.', 'sage');
      } else {
        onNotify('6-digit verification code sent to your email.', 'sage');
      }
      window.setTimeout(() => otpInputRefs.current[0]?.focus(), 60);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Unable to send code.');
    } finally {
      setOtpBusy(false);
    }
  };

  const handleOtpDigitChange = (index: number, value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    if (!digitsOnly) {
      setOtpDigits((prev) => {
        const next = [...prev];
        next[index] = '';
        return next;
      });
      return;
    }

    if (digitsOnly.length > 1) {
      const chars = digitsOnly.slice(0, 6).split('');
      setOtpDigits((prev) => {
        const next = [...prev];
        chars.forEach((ch, offset) => {
          if (index + offset < 6) next[index + offset] = ch;
        });
        return next;
      });
      const focusTarget = Math.min(5, index + chars.length);
      otpInputRefs.current[focusTarget]?.focus();
      return;
    }

    setOtpDigits((prev) => {
      const next = [...prev];
      next[index] = digitsOnly;
      return next;
    });
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter' && otpDigits.join('').length === 6) {
      void handleVerifyOtp();
    }
  };

  const handleVerifyOtp = async (overrideCode?: string) => {
    const code = overrideCode ?? otpDigits.join('');
    setOtpError('');
    if (code.length !== 6) {
      setOtpError('Enter all 6 digits from your verification email.');
      return;
    }

    setOtpBusy(true);
    try {
      const verified = await verifyEmailOtp(email, code);
      setVerifiedUid(verified.uid);
      setDevOtpPreview(null);

      // Returning user check (Firestore or local session matching email)
      const cloudProfile = await fetchUserProfileFromCloud(verified.uid).catch(() => null);
      if (cloudProfile) {
        onNotify(`Welcome back, ${cloudProfile.displayName}.`, 'sage');
        onComplete(cloudProfile, true);
        return;
      }

      if (
        existingLocalProfile &&
        existingLocalProfile.email.toLowerCase() === verified.email.toLowerCase()
      ) {
        onNotify(`Welcome back, ${existingLocalProfile.displayName}.`, 'sage');
        onComplete(existingLocalProfile, true);
        return;
      }

      onNotify('Email verified without sharing a phone number.', 'sage');
      setStep(3);
    } catch (err) {
      setOtpError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setOtpBusy(false);
    }
  };

  const handleGoogleContinue = async () => {
    if (!auth) {
      onNotify('Firebase Auth is not initialized in this environment.', 'terracotta');
      return;
    }
    setOtpBusy(true);
    setOtpError('');
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const userEmail = cred.user.email || '';
      setEmail(userEmail);
      setVerifiedUid(cred.user.uid);
      if (cred.user.displayName && !displayName) {
        setDisplayName(cred.user.displayName.split(' ')[0]);
      }

      const cloudProfile = await fetchUserProfileFromCloud(cred.user.uid).catch(() => null);
      if (cloudProfile) {
        onNotify(`Welcome back, ${cloudProfile.displayName}.`, 'sage');
        onComplete(cloudProfile, true);
        return;
      }

      onNotify('Signed in with Google for live cloud persistence.', 'sage');
      setStep(3);
    } catch (err) {
      setOtpError(
        err instanceof Error ? err.message : 'Google sign-in was cancelled or blocked.'
      );
    } finally {
      setOtpBusy(false);
    }
  };

  const resolvedCity = customCity.trim() || city;

  const buildDraftProfile = (): UserProfile => {
    const now = Date.now();
    return {
      uid: verifiedUid || `otp_${now}`,
      email: email.trim().toLowerCase() || 'member@duet.community',
      emailVerifiedViaOtp: true,
      displayName: displayName.trim() || 'Member',
      age: Math.max(18, Number(age) || 29),
      city: resolvedCity || 'Bengaluru',
      hometown: hometown.trim() || undefined,
      workOrCraft: workOrCraft.trim() || undefined,
      genders: genders.length > 0 ? genders : ['Self-described'],
      showGender,
      pronouns: pronouns.length > 0 ? pronouns : ['they/them'],
      orientations: orientations.length > 0 ? orientations : ['Queer'],
      showOrientation,
      relationshipStyles:
        relationshipStyles.length > 0 ? relationshipStyles : ['Monogamous'],
      childfreePledgeSigned: true,
      feministQueerPledgeSigned: true,
      childfreeStanceBadge,
      showSterilizedBadge:
        showSterilizedBadge ||
        childfreeStanceBadge === 'Childfree & Sterilized / Vasectomy',
      valuesAndLifestyle,
      photos,
      prompts,
      discoveryPreferences: {
        interestedInGenders,
        ageMin,
        ageMax,
        cities: [],
        relationshipStyles: [],
        prioritizeQueerCommunity,
      },
      safetySettings: {
        proactiveIncognitoMode,
        allowNotesBeforeMatch,
        pauseProfile: false,
      },
      blockedUids: [],
      createdAt: now,
      updatedAt: now,
    };
  };

  const validateAndAdvanceStep3 = () => {
    const parsedAge = Number(age);
    if (!displayName.trim()) {
      setStep3Error('Please share your first name.');
      return;
    }
    if (!Number.isFinite(parsedAge) || parsedAge < 18 || parsedAge > 105) {
      setStep3Error('Duet is strictly for adults aged 18 and over.');
      return;
    }
    if (pronouns.length === 0) {
      setStep3Error('Select at least one pronoun set or add your own.');
      return;
    }
    if (genders.length === 0) {
      setStep3Error('Select at least one gender identity or self-describe.');
      return;
    }
    if (orientations.length === 0) {
      setStep3Error('Select at least one orientation or self-describe.');
      return;
    }
    if (relationshipStyles.length === 0) {
      setStep3Error('Select at least one relationship structure.');
      return;
    }
    setStep3Error('');
    setStep(4);
  };

  const validateAndAdvanceStep6 = () => {
    const allAnswered = prompts.every((p) => p.answer.trim().length >= 8);
    if (!allAnswered) {
      setStep6Error('Please write thoughtful answers (at least 8 characters) for all 3 prompts.');
      return;
    }
    if (valuesAndLifestyle.length < 3 || valuesAndLifestyle.length > 8) {
      setStep6Error('Please select between 3 and 8 values & lifestyle tags.');
      return;
    }
    setStep6Error('');
    setStep(7);
  };

  const handlePublish = async () => {
    setPublishing(true);
    try {
      const profile = buildDraftProfile();
      onComplete(profile, false);
    } finally {
      setPublishing(false);
    }
  };

  const progressPercent = (step / 7) * 100;

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col">
      {/* Sleek 2px sage progress bar */}
      <div className="sticky top-0 z-30 bg-[#FAF9F6]/95 backdrop-blur-md">
        <div className="h-[2px] w-full bg-[#EAE6DF]">
          <div
            className="h-full bg-[#3F6251] transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="font-serif text-3xl text-[#18181B]">Duet</span>
          <span className="text-xs text-[#71717A] tabular-nums">
            Step {step} of 7
          </span>
        </div>
      </div>

      <main className="flex-1 w-full max-w-5xl mx-auto px-5 sm:px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          {/* Calm Editorial Context Column (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4 sticky top-24 space-y-6 pr-4">
            <div className="space-y-3">
              <p className="text-xs font-medium text-[#3F6251]">
                Intentionally Childfree · Feminist · Queer-Friendly
              </p>
              <h2 className="font-serif text-4xl leading-[1.12] text-[#18181B]">
                Dating built around clarity, consent, and shared freedom.
              </h2>
              <p className="text-sm text-[#71717A] leading-relaxed">
                No fence-sitters, no phone-number tracking, and no shallow swiping. Every profile starts with mutual boundaries.
              </p>
            </div>
            <ol className="border-t border-[#EAE6DF] pt-5 space-y-2.5 text-xs">
              {[
                'Childfree Boundary & Feminist Pledge',
                'Passwordless Email OTP (Zero Phone Numbers)',
                'Expansive Identity, Pronouns & Orientation',
                'City, Vitals & Inclusive Discovery',
                'Editorial Photo Studio',
                'Curated Prompts & Values',
                'Consent Controls & Live Preview',
              ].map((label, idx) => {
                const stepNum = idx + 1;
                const isDone = step > stepNum;
                const isCurrent = step === stepNum;
                return (
                  <li
                    key={label}
                    className={`flex items-center gap-2.5 transition-colors ${
                      isCurrent
                        ? 'text-[#18181B] font-medium'
                        : isDone
                        ? 'text-[#3F6251]'
                        : 'text-[#A1A1AA]'
                    }`}
                  >
                    <span className="tabular-nums w-5 shrink-0">
                      {isDone ? (
                        <Check className="w-3.5 h-3.5 text-[#3F6251]" />
                      ) : (
                        `0${stepNum}.`
                      )}
                    </span>
                    <span>{label}</span>
                  </li>
                );
              })}
            </ol>
          </aside>

          {/* Primary Single-Column Wizard Surface */}
          <section className="lg:col-span-8 bg-white border border-[#EAE6DF] rounded-[2rem] p-6 sm:p-9 md:p-10 shadow-[0_2px_24px_rgba(24,24,27,0.03)]">
            {/* STEP 1: Childfree Gatekeeper & Feminist Pledge */}
            {step === 1 && (
              <div className="space-y-7">
                <div>
                  <p className="text-xs font-medium text-[#3F6251] mb-2">
                    Community Boundary
                  </p>
                  <h1 className="font-serif text-4xl sm:text-[2.75rem] leading-[1.1] text-[#18181B]">
                    Where do you stand on having children?
                  </h1>
                  <p className="text-sm text-[#71717A] mt-3 leading-relaxed">
                    Duet exists exclusively for adults who are certain they want a childfree life—saving everyone from heartbreak and wasted emotional labor.
                  </p>
                </div>

                {stance === 'unsure' || stance === 'wants_kids' ? (
                  <div className="rounded-3xl bg-[#FBF1EE] border border-[#E8C5B8] p-6 sm:p-7 space-y-4">
                    <div className="w-10 h-10 rounded-full bg-white text-[#C86D51] flex items-center justify-center">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <h2 className="font-serif text-3xl text-[#18181B]">
                      Thank you for your honesty.
                    </h2>
                    <p className="text-sm text-[#52525B] leading-relaxed">
                      Duet is a protected space strictly for people who are 100% certain they do not want children—biological, adopted, or step-parenting. Protecting our community from fence-sitters or “maybe someday” keeps dating calm, honest, and respectful for everyone.
                    </p>
                    <p className="text-xs text-[#71717A] leading-relaxed">
                      If you tapped this by mistake or your stance is firmly childfree, you can revisit your selection below.
                    </p>
                    <button
                      type="button"
                      onClick={() => setStance(null)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white border border-[#E8C5B8] text-sm font-medium text-[#8F432C] hover:bg-[#FAF9F6] transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      Revisit my answer
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3" role="radiogroup" aria-label="Childfree stance">
                      {[
                        {
                          id: 'childfree' as const,
                          title: '100% Childfree — I do not want children, ever.',
                          desc: 'Certain about staying childfree across biological, adopted, and step-parenting paths.',
                        },
                        {
                          id: 'unsure' as const,
                          title: 'Unsure / Fence-sitter',
                          desc: 'Still deciding or open depending on the right partner.',
                        },
                        {
                          id: 'wants_kids' as const,
                          title: 'I want children someday',
                          desc: 'Hoping to become a parent in the future.',
                        },
                      ].map((opt) => {
                        const selected = stance === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setStance(opt.id)}
                            className={`w-full text-left p-5 rounded-2xl border transition-all ${
                              selected
                                ? 'bg-[#EEF3F0] border-[#3F6251]'
                                : 'bg-[#FAF9F6] border-[#EAE6DF] hover:border-[#C7C1B7]'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-medium text-[#18181B]">
                                  {opt.title}
                                </p>
                                <p className="text-xs text-[#71717A] mt-1 leading-relaxed">
                                  {opt.desc}
                                </p>
                              </div>
                              <span
                                className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                  selected
                                    ? 'bg-[#3F6251] border-[#3F6251] text-white'
                                    : 'border-[#C7C1B7] bg-white'
                                }`}
                              >
                                {selected && <Check className="w-3 h-3" />}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {stance === 'childfree' && (
                      <div className="space-y-3 pt-2 border-t border-[#F2EFEA]">
                        <p className="text-xs font-medium text-[#3F6251]">
                          Two mandatory community pledges
                        </p>

                        <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={childfreePledge}
                            onChange={(e) => setChildfreePledge(e.target.checked)}
                            className="mt-1 w-4 h-4 accent-[#3F6251] shrink-0"
                          />
                          <span className="text-sm text-[#18181B] leading-relaxed">
                            <strong className="font-medium">Childfree Boundary Pledge:</strong>{' '}
                            I am 100% certain I do not want children—biological, adopted, or step-parenting—and will never pressure or hope for a partner to change their mind.
                          </span>
                        </label>

                        <label className="flex items-start gap-3.5 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={feministPledge}
                            onChange={(e) => setFeministPledge(e.target.checked)}
                            className="mt-1 w-4 h-4 accent-[#3F6251] shrink-0"
                          />
                          <span className="text-sm text-[#18181B] leading-relaxed">
                            <strong className="font-medium">
                              Feminist, Consent &amp; Queer-Inclusion Pledge:
                            </strong>{' '}
                            I commit to enthusiastic consent, equal emotional labor, and zero tolerance for misogyny, transphobia, queerphobia, casteism, or unsolicited explicit content.
                          </span>
                        </label>

                        <div className="pt-3 flex justify-end">
                          <button
                            type="button"
                            disabled={!childfreePledge || !feministPledge}
                            onClick={() => setStep(2)}
                            className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] disabled:opacity-40 transition-colors"
                          >
                            Continue to Verification
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* STEP 2: Passwordless Email OTP (No Phone Numbers) */}
            {step === 2 && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => {
                    setOtpStage('email');
                    setDevOtpPreview(null);
                    setStep(1);
                  }}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div>
                  <p className="text-xs font-medium text-[#3F6251] mb-2">
                    Privacy-First Sign-In · Zero Phone Numbers
                  </p>
                  <h1 className="font-serif text-4xl leading-[1.1] text-[#18181B]">
                    {otpStage === 'email'
                      ? 'Verify with your email.'
                      : 'Enter your 6-digit code.'}
                  </h1>
                  <p className="text-sm text-[#71717A] mt-3 leading-relaxed">
                    {otpStage === 'email'
                      ? 'We never ask for your phone number. Enter your email to receive a 6-digit verification code.'
                      : `We issued a 6-digit verification code for ${email.trim().toLowerCase()}.`}
                  </p>
                </div>

                {otpStage === 'email' ? (
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="onboarding-email"
                        className="block text-xs font-medium text-[#52525B] mb-1.5"
                      >
                        Email address
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-[#71717A] absolute left-4 top-1/2 -translate-y-1/2" />
                        <input
                          id="onboarding-email"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') void handleSendOtp();
                          }}
                          placeholder="you@domain.com"
                          className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm text-[#18181B] focus:outline-none focus:border-[#3F6251]"
                        />
                      </div>
                    </div>

                    {otpError && (
                      <p role="alert" className="text-xs text-[#C86D51]">
                        {otpError}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={otpBusy}
                      onClick={() => void handleSendOtp()}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] disabled:opacity-50 transition-colors"
                    >
                      {otpBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                      Send 6-digit code
                    </button>

                    <div className="relative py-2">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-[#EAE6DF]" />
                      </div>
                      <div className="relative flex justify-center">
                        <span className="bg-white px-3 text-xs text-[#71717A]">
                          or use live cloud account
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={otpBusy}
                      onClick={() => void handleGoogleContinue()}
                      className="w-full py-3 px-6 rounded-full bg-[#FAF9F6] border border-[#EAE6DF] text-sm font-medium text-[#18181B] hover:border-[#3F6251] transition-colors"
                    >
                      Continue with Google (Firestore &amp; Storage Sync)
                    </button>
                  </div>
                ) : (
                  <div className="space-y-5">
                    <div
                      className="grid grid-cols-6 gap-2 sm:gap-3"
                      aria-label="6-digit verification code"
                    >
                      {otpDigits.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => {
                            otpInputRefs.current[idx] = el;
                          }}
                          type="text"
                          inputMode="numeric"
                          autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                          maxLength={6}
                          aria-label={`Verification code digit ${idx + 1}`}
                          value={digit}
                          onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                          onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                          className="h-14 sm:h-16 text-center font-mono text-2xl font-semibold rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-[#18181B] focus:outline-none focus:border-[#3F6251] focus:bg-white tabular-nums"
                        />
                      ))}
                    </div>

                    {otpError && (
                      <p role="alert" className="text-xs text-[#C86D51]">
                        {otpError}
                      </p>
                    )}

                    <button
                      type="button"
                      disabled={otpBusy || otpDigits.join('').length < 6}
                      onClick={() => void handleVerifyOtp()}
                      className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-6 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] disabled:opacity-45 transition-colors"
                    >
                      {otpBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                      Verify &amp; Continue
                    </button>

                    <div className="flex items-center justify-between text-xs text-[#71717A]">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpStage('email');
                          setOtpError('');
                        }}
                        className="hover:text-[#18181B] underline underline-offset-2"
                      >
                        Change email
                      </button>

                      <button
                        type="button"
                        disabled={resendSeconds > 0 || otpBusy}
                        onClick={() => void handleSendOtp()}
                        className="text-[#3F6251] font-medium disabled:text-[#A1A1AA] tabular-nums"
                      >
                        {resendSeconds > 0
                          ? `Resend code in ${resendSeconds}s`
                          : 'Resend code'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 3: Identity, Pronouns, Orientation & Relationship Style */}
            {step === 3 && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div>
                  <p className="text-xs font-medium text-[#3F6251] mb-2">
                    Self-Defined Identity
                  </p>
                  <h1 className="font-serif text-4xl leading-[1.1] text-[#18181B]">
                    Introduce yourself on your own terms.
                  </h1>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="onboarding-name"
                      className="block text-xs font-medium text-[#52525B] mb-1.5"
                    >
                      First name
                    </label>
                    <input
                      id="onboarding-name"
                      type="text"
                      maxLength={60}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="e.g. Maya, Kai, Rohan"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboarding-age"
                      className="block text-xs font-medium text-[#52525B] mb-1.5"
                    >
                      Age (18+)
                    </label>
                    <input
                      id="onboarding-age"
                      type="number"
                      min={18}
                      max={105}
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm tabular-nums focus:outline-none focus:border-[#3F6251]"
                    />
                  </div>
                </div>

                {/* Pronouns */}
                <div>
                  <p className="text-xs font-medium text-[#52525B] mb-2">Pronouns</p>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {Array.from(new Set([...PRONOUN_OPTIONS, ...pronouns])).map((item) => {
                      const active = pronouns.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleMulti(pronouns, item, setPronouns, 4)}
                          className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                            active
                              ? 'bg-[#6D4C6E] text-white border-[#6D4C6E]'
                              : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customPronoun}
                      onChange={(e) => setCustomPronoun(e.target.value)}
                      placeholder="Add custom pronouns"
                      aria-label="Custom pronouns"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-xs focus:outline-none focus:border-[#3F6251]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addCustomChip(
                          customPronoun,
                          pronouns,
                          setPronouns,
                          () => setCustomPronoun(''),
                          4
                        )
                      }
                      className="px-4 py-2 rounded-xl border border-[#EAE6DF] text-xs font-medium text-[#18181B] hover:border-[#3F6251]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Gender Identity */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="text-xs font-medium text-[#52525B]">Gender Identity</p>
                    <label className="inline-flex items-center gap-2 text-xs text-[#71717A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showGender}
                        onChange={(e) => setShowGender(e.target.checked)}
                        className="accent-[#3F6251]"
                      />
                      Show on profile
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {Array.from(new Set([...GENDER_OPTIONS, ...genders])).map((item) => {
                      const active = genders.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleMulti(genders, item, setGenders, 6)}
                          className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                            active
                              ? 'bg-[#3F6251] text-white border-[#3F6251]'
                              : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customGender}
                      onChange={(e) => setCustomGender(e.target.value)}
                      placeholder="Self-describe gender identity"
                      aria-label="Self-describe gender identity"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-xs focus:outline-none focus:border-[#3F6251]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addCustomChip(
                          customGender,
                          genders,
                          setGenders,
                          () => setCustomGender(''),
                          6
                        )
                      }
                      className="px-4 py-2 rounded-xl border border-[#EAE6DF] text-xs font-medium text-[#18181B] hover:border-[#3F6251]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Sexual Orientation */}
                <div>
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <p className="text-xs font-medium text-[#52525B]">Sexual Orientation</p>
                    <label className="inline-flex items-center gap-2 text-xs text-[#71717A] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showOrientation}
                        onChange={(e) => setShowOrientation(e.target.checked)}
                        className="accent-[#3F6251]"
                      />
                      Show on profile
                    </label>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2.5">
                    {Array.from(new Set([...ORIENTATION_OPTIONS, ...orientations])).map(
                      (item) => {
                        const active = orientations.includes(item);
                        return (
                          <button
                            key={item}
                            type="button"
                            onClick={() =>
                              toggleMulti(orientations, item, setOrientations, 6)
                            }
                            className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                              active
                                ? 'bg-[#3F6251] text-white border-[#3F6251]'
                                : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                            }`}
                          >
                            {item}
                          </button>
                        );
                      }
                    )}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customOrientation}
                      onChange={(e) => setCustomOrientation(e.target.value)}
                      placeholder="Self-describe orientation"
                      aria-label="Self-describe orientation"
                      className="flex-1 px-3.5 py-2 rounded-xl bg-[#FAF9F6] border border-[#EAE6DF] text-xs focus:outline-none focus:border-[#3F6251]"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        addCustomChip(
                          customOrientation,
                          orientations,
                          setOrientations,
                          () => setCustomOrientation(''),
                          6
                        )
                      }
                      className="px-4 py-2 rounded-xl border border-[#EAE6DF] text-xs font-medium text-[#18181B] hover:border-[#3F6251]"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Relationship Structure */}
                <div>
                  <p className="text-xs font-medium text-[#52525B] mb-2">
                    Relationship Structure
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {RELATIONSHIP_STYLE_OPTIONS.map((style) => {
                      const active = relationshipStyles.includes(style);
                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() =>
                            toggleMulti(relationshipStyles, style, setRelationshipStyles, 5)
                          }
                          className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                            active
                              ? 'bg-[#3F6251] text-white border-[#3F6251]'
                              : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                          }`}
                        >
                          {style}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {step3Error && (
                  <p role="alert" className="text-xs text-[#C86D51]">
                    {step3Error}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={validateAndAdvanceStep3}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
                  >
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Location, Vitals & Who You Want to Meet */}
            {step === 4 && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div>
                  <p className="text-xs font-medium text-[#3F6251] mb-2">
                    Location &amp; Discovery
                  </p>
                  <h1 className="font-serif text-4xl leading-[1.1] text-[#18181B]">
                    Where are you rooted, and who do you hope to meet?
                  </h1>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#52525B] mb-2">City</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {CITY_QUICK_PICKS.map((pick) => (
                      <button
                        key={pick}
                        type="button"
                        onClick={() => {
                          setCity(pick);
                          setCustomCity('');
                        }}
                        className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                          !customCity.trim() && city === pick
                            ? 'bg-[#3F6251] text-white border-[#3F6251]'
                            : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                        }`}
                      >
                        {pick}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(e) => setCustomCity(e.target.value)}
                    placeholder="Or type another city"
                    aria-label="Custom city"
                    className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="onboarding-craft"
                      className="block text-xs font-medium text-[#52525B] mb-1.5"
                    >
                      Work or creative craft (optional)
                    </label>
                    <input
                      id="onboarding-craft"
                      type="text"
                      maxLength={120}
                      value={workOrCraft}
                      onChange={(e) => setWorkOrCraft(e.target.value)}
                      placeholder="e.g. Architect & ceramicist"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboarding-hometown"
                      className="block text-xs font-medium text-[#52525B] mb-1.5"
                    >
                      Hometown (optional)
                    </label>
                    <input
                      id="onboarding-hometown"
                      type="text"
                      maxLength={80}
                      value={hometown}
                      onChange={(e) => setHometown(e.target.value)}
                      placeholder="e.g. Kochi, Jaipur"
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm focus:outline-none focus:border-[#3F6251]"
                    />
                  </div>
                </div>

                <div>
                  <p className="text-xs font-medium text-[#52525B] mb-2">
                    Who you want to meet
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {DISCOVERY_GENDER_GROUPS.map((group) => {
                      const active = interestedInGenders.includes(group);
                      return (
                        <button
                          key={group}
                          type="button"
                          onClick={() => {
                            if (group === 'Everyone') {
                              setInterestedInGenders(['Everyone']);
                            } else {
                              const cleaned = interestedInGenders.filter(
                                (g) => g !== 'Everyone'
                              );
                              const next = cleaned.includes(group)
                                ? cleaned.filter((g) => g !== group)
                                : [...cleaned, group];
                              setInterestedInGenders(next.length ? next : ['Everyone']);
                            }
                          }}
                          className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                            active
                              ? 'bg-[#3F6251] text-white border-[#3F6251]'
                              : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                          }`}
                        >
                          {group}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="onboarding-age-min"
                      className="block text-xs font-medium text-[#52525B] mb-1.5"
                    >
                      Preferred age min
                    </label>
                    <input
                      id="onboarding-age-min"
                      type="number"
                      min={18}
                      max={ageMax}
                      value={ageMin}
                      onChange={(e) =>
                        setAgeMin(Math.max(18, Math.min(ageMax, Number(e.target.value) || 18)))
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm tabular-nums focus:outline-none focus:border-[#3F6251]"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="onboarding-age-max"
                      className="block text-xs font-medium text-[#52525B] mb-1.5"
                    >
                      Preferred age max
                    </label>
                    <input
                      id="onboarding-age-max"
                      type="number"
                      min={ageMin}
                      max={85}
                      value={ageMax}
                      onChange={(e) =>
                        setAgeMax(Math.max(ageMin, Math.min(85, Number(e.target.value) || 40)))
                      }
                      className="w-full px-4 py-3 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] text-sm tabular-nums focus:outline-none focus:border-[#3F6251]"
                    />
                  </div>
                </div>

                <label className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F6F1F6]/70 border border-[#E5D9E6] cursor-pointer">
                  <div>
                    <p className="text-sm font-medium text-[#583C59]">
                      Prioritize Queer Community
                    </p>
                    <p className="text-xs text-[#71717A] mt-0.5">
                      Show queer, trans, and gender-expansive childfree members first in Discover.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prioritizeQueerCommunity}
                    onChange={(e) => setPrioritizeQueerCommunity(e.target.checked)}
                    className="w-5 h-5 accent-[#6D4C6E]"
                  />
                </label>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
                  >
                    Continue to Photo Studio
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: Hinge-Style Photo Upload Studio */}
            {step === 5 && (
              <div className="space-y-6">
                <button
                  type="button"
                  onClick={() => setStep(4)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div>
                  <p className="text-xs font-medium text-[#3F6251] mb-2">
                    Photo Studio · Minimum 1 Portrait
                  </p>
                  <h1 className="font-serif text-4xl leading-[1.1] text-[#18181B]">
                    Curate up to 6 editorial frames.
                  </h1>
                  <p className="text-sm text-[#71717A] mt-2 leading-relaxed">
                    Tap any uploaded frame to attach a Hinge-style photo prompt or caption, or create a privacy-first Editorial Monogram card.
                  </p>
                </div>

                <PhotoStudio
                  uid={verifiedUid || 'draft_member'}
                  displayName={displayName || 'You'}
                  city={resolvedCity}
                  photos={photos}
                  onChange={setPhotos}
                  onNotify={onNotify}
                />

                <div className="pt-2 flex items-center justify-between gap-4">
                  <span className="text-xs text-[#71717A] tabular-nums">
                    {photos.length} / 6 added
                  </span>
                  <button
                    type="button"
                    disabled={photos.length < 1}
                    onClick={() => setStep(6)}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] disabled:opacity-40 transition-colors"
                  >
                    Continue to Prompts
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 6: Thoughtful Prompts & Values */}
            {step === 6 && (
              <div className="space-y-7">
                <button
                  type="button"
                  onClick={() => setStep(5)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div>
                  <p className="text-xs font-medium text-[#3F6251] mb-2">
                    Editorial Depth
                  </p>
                  <h1 className="font-serif text-4xl leading-[1.1] text-[#18181B]">
                    Give someone something real to respond to.
                  </h1>
                </div>

                {/* 3 Prompts */}
                <div className="space-y-4">
                  {prompts.map((prompt, index) => (
                    <div
                      key={prompt.id}
                      className="p-5 rounded-3xl bg-[#FAF9F6] border border-[#EAE6DF] space-y-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`prompt-q-${index}`}
                          className="text-xs font-medium text-[#3F6251]"
                        >
                          Prompt {index + 1}
                        </label>
                        <span className="text-[11px] text-[#71717A] tabular-nums">
                          {prompt.answer.length}/260
                        </span>
                      </div>

                      <select
                        id={`prompt-q-${index}`}
                        value={prompt.question}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrompts((prev) =>
                            prev.map((item, idx) =>
                              idx === index ? { ...item, question: val } : item
                            )
                          );
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#EAE6DF] text-sm text-[#18181B] focus:outline-none focus:border-[#3F6251]"
                      >
                        {ALL_CURATED_PROMPTS.map((q) => (
                          <option key={q} value={q}>
                            {q}
                          </option>
                        ))}
                      </select>

                      <textarea
                        rows={3}
                        maxLength={260}
                        aria-label={`Answer for prompt ${index + 1}`}
                        value={prompt.answer}
                        onChange={(e) => {
                          const val = e.target.value;
                          setPrompts((prev) =>
                            prev.map((item, idx) =>
                              idx === index ? { ...item, answer: val } : item
                            )
                          );
                        }}
                        placeholder="Write in your own voice..."
                        className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#EAE6DF] text-sm text-[#18181B] placeholder:text-[#A1A1AA] focus:outline-none focus:border-[#3F6251] resize-none"
                      />
                    </div>
                  ))}
                </div>

                {/* Values & Lifestyle Chips */}
                <div>
                  <div className="flex items-baseline justify-between mb-2.5">
                    <p className="text-xs font-medium text-[#52525B]">
                      Values &amp; Lifestyle (choose 3 to 8)
                    </p>
                    <span className="text-xs text-[#71717A] tabular-nums">
                      {valuesAndLifestyle.length} / 8
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {VALUES_AND_LIFESTYLE_OPTIONS.map((val) => {
                      const active = valuesAndLifestyle.includes(val);
                      return (
                        <button
                          key={val}
                          type="button"
                          onClick={() =>
                            toggleMulti(
                              valuesAndLifestyle,
                              val,
                              setValuesAndLifestyle,
                              8
                            )
                          }
                          className={`px-3.5 py-2 rounded-full text-xs border transition-colors ${
                            active
                              ? 'bg-[#3F6251] text-white border-[#3F6251]'
                              : 'bg-[#FAF9F6] text-[#52525B] border-[#EAE6DF]'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Childfree Stance Badge */}
                <div className="space-y-3">
                  <p className="text-xs font-medium text-[#52525B]">
                    Childfree Stance Badge
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {CHILDFREE_STANCE_OPTIONS.map((badge) => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => setChildfreeStanceBadge(badge)}
                        className={`px-4 py-3 rounded-2xl text-left text-xs font-medium border transition-colors ${
                          childfreeStanceBadge === badge
                            ? 'bg-[#EEF3F0] border-[#3F6251] text-[#2C4739]'
                            : 'bg-[#FAF9F6] border-[#EAE6DF] text-[#52525B]'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                  <label className="inline-flex items-center gap-2.5 text-xs text-[#52525B] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showSterilizedBadge}
                      onChange={(e) => setShowSterilizedBadge(e.target.checked)}
                      className="accent-[#3F6251]"
                    />
                    Also display optional Sterilized / Vasectomy badge
                  </label>
                </div>

                {step6Error && (
                  <p role="alert" className="text-xs text-[#C86D51]">
                    {step6Error}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={validateAndAdvanceStep6}
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] transition-colors"
                  >
                    Preview &amp; Consent Controls
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 7: Consent Controls & Live Profile Preview */}
            {step === 7 && (
              <div className="space-y-7">
                <button
                  type="button"
                  onClick={() => setStep(6)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#71717A] hover:text-[#18181B]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>

                <div>
                  <p className="text-xs font-medium text-[#3F6251] mb-2">
                    Final Step · Consent First
                  </p>
                  <h1 className="font-serif text-4xl leading-[1.1] text-[#18181B]">
                    Set your privacy boundaries &amp; preview.
                  </h1>
                </div>

                <div className="space-y-3">
                  <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-[#18181B]">
                        Proactive Incognito Discovery Mode
                      </p>
                      <p className="text-xs text-[#71717A] mt-0.5 leading-relaxed">
                        Only show my profile to people I have liked first. Browse calmly without unsolicited visibility.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={proactiveIncognitoMode}
                      onChange={(e) => setProactiveIncognitoMode(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-[#3F6251] shrink-0"
                    />
                  </label>

                  <label className="flex items-start justify-between gap-4 p-4 rounded-2xl bg-[#FAF9F6] border border-[#EAE6DF] cursor-pointer">
                    <div>
                      <p className="text-sm font-medium text-[#18181B]">
                        Allow opening notes with likes
                      </p>
                      <p className="text-xs text-[#71717A] mt-0.5 leading-relaxed">
                        Turn off if you prefer receiving written messages only after a mutual match.
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={allowNotesBeforeMatch}
                      onChange={(e) => setAllowNotesBeforeMatch(e.target.checked)}
                      className="mt-1 w-5 h-5 accent-[#3F6251] shrink-0"
                    />
                  </label>
                </div>

                {/* Live Editorial Profile Preview */}
                <div className="pt-2">
                  <div className="flex items-center gap-2 text-xs font-medium text-[#71717A] mb-4">
                    <ShieldCheck className="w-4 h-4 text-[#3F6251]" />
                    Live Editorial Preview
                  </div>
                  <div className="p-4 sm:p-5 rounded-[2rem] bg-[#FAF9F6] border border-[#EAE6DF]">
                    <ProfileCardContent
                      profile={buildDraftProfile()}
                      interactive={false}
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    disabled={publishing}
                    onClick={() => void handlePublish()}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full bg-[#3F6251] text-white text-sm font-medium hover:bg-[#345143] disabled:opacity-50 transition-colors"
                  >
                    {publishing && <Loader2 className="w-4 h-4 animate-spin" />}
                    Publish Profile &amp; Enter Duet
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <DevOtpInboxDrawer
        preview={devOtpPreview}
        onClose={() => setDevOtpPreview(null)}
        onQuickFill={(code) => {
          setOtpDigits(code.split(''));
          void handleVerifyOtp(code);
        }}
      />
    </div>
  );
}
