export type RewardAction =
  | 'daily_login'
  | 'try_on'
  | 'share'
  | 'review'
  | 'save_item'
  | 'color_analysis'
  | 'add_to_cart'
  | 'checkout'
  | 'style_chat';

export interface RewardAchievement {
  id: string;
  title: string;
  description: string;
  progress: number;
  total: number;
  reward: number;
  completed: boolean;
  claimed: boolean;
}

export interface RewardActivity {
  id: string;
  action: RewardAction | 'achievement' | 'claim';
  label: string;
  tokens: number;
  createdAt: string;
}

export interface RewardProfile {
  tokens: number;
  lifetimeTokens: number;
  level: number;
  progress: number;
  achievements: RewardAchievement[];
  claimedRewards: string[];
  activity: RewardActivity[];
  completedActions: Record<string, string>;
  lastDailyLogin?: string;
}

export interface RewardResult {
  profile: RewardProfile;
  tokensEarned: number;
  message: string;
  skipped?: boolean;
}

const STORAGE_PREFIX = 'swyf_rewards_v2';
const LEVEL_SIZE = 100;

const ACTIONS: Record<RewardAction, { tokens: number; label: string; achievement?: string }> = {
  daily_login: { tokens: 2, label: 'Daily login' },
  try_on: { tokens: 8, label: 'Virtual try-on', achievement: 'fashion-explorer' },
  share: { tokens: 15, label: 'Social share', achievement: 'social-butterfly' },
  review: { tokens: 10, label: 'Product review', achievement: 'voice-of-style' },
  save_item: { tokens: 5, label: 'Saved marketplace item', achievement: 'curator' },
  color_analysis: { tokens: 25, label: 'Color analysis', achievement: 'chromatch-starter' },
  add_to_cart: { tokens: 3, label: 'Added item to cart' },
  checkout: { tokens: 50, label: 'Completed checkout', achievement: 'confident-shopper' },
  style_chat: { tokens: 6, label: 'AI stylist chat', achievement: 'style-expert' },
};

const BASE_ACHIEVEMENTS: RewardAchievement[] = [
  {
    id: 'chromatch-starter',
    title: 'Chromatch Starter',
    description: 'Complete your first color analysis',
    progress: 0,
    total: 1,
    reward: 40,
    completed: false,
    claimed: false,
  },
  {
    id: 'fashion-explorer',
    title: 'Fashion Explorer',
    description: 'Try on 10 different outfits',
    progress: 0,
    total: 10,
    reward: 50,
    completed: false,
    claimed: false,
  },
  {
    id: 'social-butterfly',
    title: 'Social Butterfly',
    description: 'Share 5 try-on results',
    progress: 0,
    total: 5,
    reward: 30,
    completed: false,
    claimed: false,
  },
  {
    id: 'curator',
    title: 'Style Curator',
    description: 'Save 5 marketplace items',
    progress: 0,
    total: 5,
    reward: 35,
    completed: false,
    claimed: false,
  },
  {
    id: 'voice-of-style',
    title: 'Voice of Style',
    description: 'Leave 2 product reviews',
    progress: 0,
    total: 2,
    reward: 45,
    completed: false,
    claimed: false,
  },
  {
    id: 'confident-shopper',
    title: 'Confident Shopper',
    description: 'Complete your first checkout',
    progress: 0,
    total: 1,
    reward: 75,
    completed: false,
    claimed: false,
  },
  {
    id: 'style-expert',
    title: 'Style Expert',
    description: 'Ask the AI stylist 5 fashion questions',
    progress: 0,
    total: 5,
    reward: 100,
    completed: false,
    claimed: false,
  },
];

const todayKey = () => new Date().toISOString().slice(0, 10);

const storageKey = (accountId?: string | null) => `${STORAGE_PREFIX}_${accountId || 'guest'}`;

const freshProfile = (): RewardProfile => ({
  tokens: 0,
  lifetimeTokens: 0,
  level: 1,
  progress: 0,
  achievements: BASE_ACHIEVEMENTS.map(a => ({ ...a })),
  claimedRewards: [],
  activity: [],
  completedActions: {},
});

const normalizeProfile = (raw: Partial<RewardProfile> | null): RewardProfile => {
  const base = freshProfile();
  if (!raw) return base;

  const achievements = BASE_ACHIEVEMENTS.map(template => {
    const existing = raw.achievements?.find(a => a.id === template.id);
    const progress = Math.min(existing?.progress ?? template.progress, template.total);
    return {
      ...template,
      ...existing,
      progress,
      completed: progress >= template.total,
      claimed: existing?.claimed ?? false,
    };
  });

  const lifetimeTokens = raw.lifetimeTokens ?? raw.tokens ?? 0;
  return {
    ...base,
    ...raw,
    tokens: raw.tokens ?? 0,
    lifetimeTokens,
    level: Math.floor(lifetimeTokens / LEVEL_SIZE) + 1,
    progress: lifetimeTokens % LEVEL_SIZE,
    achievements,
    claimedRewards: raw.claimedRewards ?? [],
    activity: raw.activity ?? [],
    completedActions: raw.completedActions ?? {},
  };
};

export const getRewardProfile = (accountId?: string | null): RewardProfile => {
  try {
    const stored = localStorage.getItem(storageKey(accountId));
    return normalizeProfile(stored ? JSON.parse(stored) : null);
  } catch {
    return freshProfile();
  }
};

export const saveRewardProfile = (accountId: string | null | undefined, profile: RewardProfile) => {
  localStorage.setItem(storageKey(accountId), JSON.stringify(profile));
  window.dispatchEvent(new CustomEvent('swyf:rewards-updated', { detail: { accountId, profile } }));
};

const pushActivity = (profile: RewardProfile, action: RewardActivity['action'], label: string, tokens: number) => {
  profile.activity = [
    {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      action,
      label,
      tokens,
      createdAt: new Date().toISOString(),
    },
    ...profile.activity,
  ].slice(0, 30);
};

const addTokens = (profile: RewardProfile, tokens: number) => {
  profile.tokens += tokens;
  profile.lifetimeTokens += tokens;
  profile.level = Math.floor(profile.lifetimeTokens / LEVEL_SIZE) + 1;
  profile.progress = profile.lifetimeTokens % LEVEL_SIZE;
};

export const applyRewardAction = (
  accountId: string | null | undefined,
  action: RewardAction,
  options: { dedupeKey?: string; label?: string } = {}
): RewardResult => {
  const profile = getRewardProfile(accountId);
  const config = ACTIONS[action];
  const key = action === 'daily_login'
    ? `${action}:${todayKey()}`
    : options.dedupeKey
      ? `${action}:${options.dedupeKey}`
      : undefined;

  if (key && profile.completedActions[key]) {
    return {
      profile,
      tokensEarned: 0,
      message: action === 'daily_login' ? 'Daily login reward already claimed today.' : 'Reward already claimed for this action.',
      skipped: true,
    };
  }

  addTokens(profile, config.tokens);
  pushActivity(profile, action, options.label ?? config.label, config.tokens);

  if (key) profile.completedActions[key] = new Date().toISOString();
  if (action === 'daily_login') profile.lastDailyLogin = todayKey();

  if (config.achievement) {
    const achievement = profile.achievements.find(a => a.id === config.achievement);
    if (achievement && achievement.progress < achievement.total) {
      achievement.progress += 1;
      achievement.completed = achievement.progress >= achievement.total;
    }
  }

  saveRewardProfile(accountId, profile);

  return {
    profile,
    tokensEarned: config.tokens,
    message: `Earned ${config.tokens} SWYF tokens for ${options.label ?? config.label}.`,
  };
};

export const claimAchievement = (accountId: string | null | undefined, achievementId: string): RewardResult => {
  const profile = getRewardProfile(accountId);
  const achievement = profile.achievements.find(a => a.id === achievementId);

  if (!achievement || !achievement.completed) {
    return { profile, tokensEarned: 0, message: 'Achievement is not complete yet.', skipped: true };
  }

  if (achievement.claimed) {
    return { profile, tokensEarned: 0, message: 'Achievement reward already claimed.', skipped: true };
  }

  achievement.claimed = true;
  addTokens(profile, achievement.reward);
  pushActivity(profile, 'achievement', `${achievement.title} achievement`, achievement.reward);
  saveRewardProfile(accountId, profile);

  return {
    profile,
    tokensEarned: achievement.reward,
    message: `Claimed ${achievement.reward} tokens from ${achievement.title}.`,
  };
};

export const redeemReward = (accountId: string | null | undefined, rewardId: string, cost: number): RewardResult => {
  const profile = getRewardProfile(accountId);

  if (profile.claimedRewards.includes(rewardId)) {
    return { profile, tokensEarned: 0, message: 'Reward already redeemed.', skipped: true };
  }

  if (profile.tokens < cost) {
    return { profile, tokensEarned: 0, message: 'Not enough tokens yet.', skipped: true };
  }

  profile.tokens -= cost;
  profile.claimedRewards.push(rewardId);
  pushActivity(profile, 'claim', `Redeemed reward`, -cost);
  saveRewardProfile(accountId, profile);

  return { profile, tokensEarned: -cost, message: 'Reward redeemed successfully.' };
};
