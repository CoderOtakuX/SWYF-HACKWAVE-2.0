import { useEffect, useMemo, useState } from 'react';
import Layout from '@/components/Layout';
import NotificationPanel from '@/components/NotificationPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  applyRewardAction,
  claimAchievement,
  getRewardProfile,
  redeemReward,
  type RewardAction,
  type RewardProfile,
} from '@/lib/rewards';
import {
  Activity,
  BadgePercent,
  Bell,
  Bookmark,
  Check,
  Clock,
  Crown,
  Gift,
  MessageCircle,
  Medal,
  Share2,
  ShoppingBag,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from 'lucide-react';

const REWARD_CATALOG = [
  {
    id: 'discount-15',
    title: '15% Off Next Purchase',
    description: 'A checkout-ready discount for your next SWYF order.',
    cost: 150,
    minLevel: 2,
    icon: BadgePercent,
  },
  {
    id: 'premium-stylist',
    title: 'Premium Style Recommendations',
    description: 'Unlock richer AI styling prompts and outfit breakdowns.',
    cost: 220,
    minLevel: 3,
    icon: Sparkles,
  },
  {
    id: 'early-access',
    title: 'Early Access Drops',
    description: 'Get first access to selected marketplace collections.',
    cost: 350,
    minLevel: 4,
    icon: Crown,
  },
  {
    id: 'vip-support',
    title: 'VIP Shopping Support',
    description: 'Priority help for sizing, color matching, and orders.',
    cost: 500,
    minLevel: 5,
    icon: MessageCircle,
  },
];

const EARNING_ACTIONS: Array<{
  action: RewardAction;
  title: string;
  description: string;
  reward: string;
  icon: typeof Star;
}> = [
  {
    action: 'daily_login',
    title: 'Daily Login',
    description: 'Claim once per day when you return to SWYF.',
    reward: '2 tokens',
    icon: Clock,
  },
  {
    action: 'try_on',
    title: 'Virtual Try-On',
    description: 'Generate try-on sessions from the projects page.',
    reward: '8 tokens',
    icon: ShoppingBag,
  },
  {
    action: 'color_analysis',
    title: 'Color Analysis',
    description: 'Complete a skin tone analysis with your photos.',
    reward: '25 tokens',
    icon: Sparkles,
  },
  {
    action: 'save_item',
    title: 'Save Marketplace Items',
    description: 'Tap the heart on products you want to revisit.',
    reward: '5 tokens',
    icon: Bookmark,
  },
  {
    action: 'review',
    title: 'Product Reviews',
    description: 'Leave helpful feedback on product detail pages.',
    reward: '10 tokens',
    icon: MessageCircle,
  },
  {
    action: 'share',
    title: 'Social Share',
    description: 'Share a look or try-on result with friends.',
    reward: '15 tokens',
    icon: Share2,
  },
];

const currency = new Intl.NumberFormat('en-IN');

const Rewards = () => {
  const { user } = useAuth();
  const accountId = user?.id ?? 'guest';
  const [profile, setProfile] = useState<RewardProfile>(() => getRewardProfile(accountId));
  const [activeTab, setActiveTab] = useState<'earn' | 'rewards' | 'achievements' | 'history'>('earn');
  const [showNotifications, setShowNotifications] = useState(false);
  const { addNotification } = useNotifications();

  useEffect(() => {
    setProfile(getRewardProfile(accountId));

    const onRewardsUpdated = () => setProfile(getRewardProfile(accountId));
    window.addEventListener('swyf:rewards-updated', onRewardsUpdated);
    window.addEventListener('storage', onRewardsUpdated);
    return () => {
      window.removeEventListener('swyf:rewards-updated', onRewardsUpdated);
      window.removeEventListener('storage', onRewardsUpdated);
    };
  }, [accountId]);

  const completedCount = useMemo(
    () => profile.achievements.filter(a => a.completed).length,
    [profile.achievements]
  );

  const runAction = (action: RewardAction) => {
    const result = applyRewardAction(accountId, action, {
      dedupeKey: action === 'daily_login' ? undefined : `manual-${Date.now()}`,
    });
    setProfile(result.profile);
    addNotification({
      type: result.skipped ? 'info' : 'success',
      title: result.skipped ? 'No New Tokens' : 'Tokens Earned',
      message: result.message,
    });
  };

  const handleClaimAchievement = (achievementId: string) => {
    const result = claimAchievement(accountId, achievementId);
    setProfile(result.profile);
    addNotification({
      type: result.skipped ? 'info' : 'success',
      title: result.skipped ? 'Not Ready Yet' : 'Achievement Claimed',
      message: result.message,
    });
  };

  const handleRedeem = (rewardId: string, cost: number) => {
    const result = redeemReward(accountId, rewardId, cost);
    setProfile(result.profile);
    addNotification({
      type: result.skipped ? 'error' : 'success',
      title: result.skipped ? 'Cannot Redeem' : 'Reward Redeemed',
      message: result.message,
    });
  };

  return (
    <Layout>
      <div className="pt-32 pb-20">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-400/20 via-primary/10 to-background" />

        <div className="fixed top-20 right-4 z-40">
          <button
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors relative"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <Bell size={20} className="text-foreground" />
          </button>
        </div>
        <NotificationPanel isOpen={showNotifications} onClose={() => setShowNotifications(false)} />

        <section className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium inline-block mb-4">
              Rewards Program
            </span>
            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4">
              Earn While You <span className="text-gradient">Explore</span>
            </h1>
            <p className="text-lg text-foreground/80">
              Your SWYF tokens now persist per user. Try on outfits, analyze colors, save products,
              review purchases, and redeem rewards from the same account.
            </p>
          </div>

          <div className="glass-morphism rounded-3xl p-6 md:p-8 mb-10">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 p-5 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                    <Star className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-foreground/60">Available Balance</p>
                    <h2 className="text-3xl font-bold">{currency.format(profile.tokens)} SWYF</h2>
                  </div>
                </div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Level {profile.level}</span>
                  <span>{profile.progress}/{100} XP to Level {profile.level + 1}</span>
                </div>
                <div className="h-3 rounded-full bg-foreground/10 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-primary"
                    style={{ width: `${profile.progress}%` }}
                  />
                </div>
              </div>

              <StatCard icon={Zap} label="Lifetime Tokens" value={currency.format(profile.lifetimeTokens)} />
              <StatCard icon={Trophy} label="Achievements" value={`${completedCount}/${profile.achievements.length}`} />
            </div>
          </div>

          <div className="flex justify-center mb-8 overflow-x-auto">
            <div className="inline-flex rounded-lg bg-white/5 p-1">
              {[
                ['earn', 'Earn Tokens'],
                ['rewards', 'Redeem'],
                ['achievements', 'Achievements'],
                ['history', 'History'],
              ].map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key as typeof activeTab)}
                  className={`px-5 py-2 rounded-md text-sm font-medium transition-all ${
                    activeTab === key ? 'bg-primary text-white' : 'text-foreground/70 hover:text-foreground'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === 'earn' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {EARNING_ACTIONS.map(item => (
                <div key={item.action} className="glass-card rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                  <p className="text-sm text-foreground/70 mb-4">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-purple-500">{item.reward}</span>
                    <button
                      onClick={() => runAction(item.action)}
                      className="px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors"
                    >
                      Claim
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'rewards' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {REWARD_CATALOG.map(reward => {
                const redeemed = profile.claimedRewards.includes(reward.id);
                const lockedByLevel = profile.level < reward.minLevel;
                const affordable = profile.tokens >= reward.cost;
                return (
                  <div key={reward.id} className="glass-card rounded-2xl p-6">
                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mb-4">
                      <reward.icon className="h-6 w-6 text-green-500" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">{reward.title}</h3>
                    <p className="text-sm text-foreground/70 mb-4">{reward.description}</p>
                    <p className="text-sm mb-4">
                      <span className="font-semibold">{reward.cost} tokens</span>
                      <span className="text-foreground/40"> · Level {reward.minLevel}+</span>
                    </p>
                    <button
                      disabled={redeemed || lockedByLevel || !affordable}
                      onClick={() => handleRedeem(reward.id, reward.cost)}
                      className="w-full px-4 py-2 rounded-lg bg-primary text-white text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {redeemed ? 'Redeemed' : lockedByLevel ? `Unlocks Level ${reward.minLevel}` : affordable ? 'Redeem' : 'Need More Tokens'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {profile.achievements.map(achievement => (
                <div key={achievement.id} className="glass-card rounded-2xl p-6">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                    <Medal className="h-6 w-6 text-amber-500" />
                  </div>
                  <h3 className="text-lg font-bold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-foreground/70 mb-4">{achievement.description}</p>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Progress</span>
                    <span>{achievement.progress}/{achievement.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-foreground/10 overflow-hidden mb-4">
                    <div
                      className="h-full rounded-full bg-amber-500"
                      style={{ width: `${(achievement.progress / achievement.total) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold">{achievement.reward} tokens</span>
                    <button
                      disabled={!achievement.completed || achievement.claimed}
                      onClick={() => handleClaimAchievement(achievement.id)}
                      className="px-3 py-1.5 rounded-lg bg-primary text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {achievement.claimed ? 'Claimed' : achievement.completed ? 'Claim' : 'In Progress'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="glass-card rounded-2xl overflow-hidden">
              {profile.activity.length === 0 ? (
                <div className="p-10 text-center text-foreground/50">
                  <Activity className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  No reward activity yet.
                </div>
              ) : (
                profile.activity.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-4 border-b border-white/5 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center ${item.tokens >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                        {item.tokens >= 0 ? <Check className="h-4 w-4 text-green-500" /> : <Gift className="h-4 w-4 text-red-500" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-foreground/40">{new Date(item.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${item.tokens >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {item.tokens >= 0 ? '+' : ''}{item.tokens}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>
      </div>
    </Layout>
  );
};

const StatCard = ({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) => (
  <div className="p-5 rounded-2xl bg-white/5 border border-white/10">
    <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center mb-4">
      <Icon className="h-5 w-5 text-purple-500" />
    </div>
    <p className="text-sm text-foreground/60">{label}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default Rewards;
