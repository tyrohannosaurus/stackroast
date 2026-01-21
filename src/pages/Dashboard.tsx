import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { LoadingFire } from "@/components/LoadingFire";
import { EmailPreferences } from "@/components/EmailPreferences";
import { 
  LayoutDashboard, 
  Layers, 
  Bell, 
  DollarSign, 
  Settings,
  Flame,
  TrendingUp,
  BarChart3,
  Award,
  ExternalLink,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

type DashboardTab = 'overview' | 'stacks' | 'notifications' | 'earnings' | 'settings';

interface UserStack {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  view_count: number;
  upvote_count: number;
  is_public: boolean;
  burn_score?: number;
}

interface Notification {
  id: string;
  type: string;
  message: string;
  created_at: string;
  read: boolean;
  reference_id?: string;
}

interface Earnings {
  total_tips: number;
  pending_payout: number;
  total_referrals: number;
  referral_earnings: number;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [stacks, setStacks] = useState<UserStack[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [earnings, setEarnings] = useState<Earnings>({ total_tips: 0, pending_payout: 0, total_referrals: 0, referral_earnings: 0 });
  const [loading, setLoading] = useState(true);

  // Settings form state
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [twitterHandle, setTwitterHandle] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/');
      toast.error('Please sign in to access your dashboard');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, activeTab]);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setGithubUrl(profile.github_url || '');
      setTwitterHandle(profile.twitter_handle || '');
    }
  }, [profile]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'overview':
        case 'stacks':
          await loadUserStacks();
          break;
        case 'notifications':
          await loadNotifications();
          break;
        case 'earnings':
          await loadEarnings();
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUserStacks = async () => {
    const { data, error } = await supabase
      .from('stacks')
      .select('id, name, slug, created_at, view_count, upvote_count, is_public')
      .eq('profile_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading stacks:', error);
      return;
    }

    // Get burn scores
    const stacksWithScores = await Promise.all(
      (data || []).map(async (stack) => {
        const { data: roast } = await supabase
          .from('ai_roasts')
          .select('burn_score')
          .eq('stack_id', stack.id)
          .maybeSingle();

        return { ...stack, burn_score: roast?.burn_score };
      })
    );

    setStacks(stacksWithScores);
  };

  const loadNotifications = async () => {
    // For now, we'll create mock notifications based on karma events
    const { data, error } = await supabase
      .from('karma_events')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    const mockNotifications: Notification[] = (data || []).map((event: any) => ({
      id: event.id,
      type: event.action_type,
      message: getNotificationMessage(event.action_type, event.points),
      created_at: event.created_at,
      read: true,
      reference_id: event.reference_id,
    }));

    setNotifications(mockNotifications);
  };

  const getNotificationMessage = (type: string, points: number) => {
    switch (type) {
      case 'stack_submit':
        return `You earned ${points} logs for submitting a stack! 🚀`;
      case 'roast_submit':
        return `You earned ${points} logs for roasting a stack! 🔥`;
      case 'discussion_post':
        return `You earned ${points} logs for posting in a discussion 💬`;
      case 'upvote_received':
        return `Your roast got upvoted! +${points} logs ⬆️`;
      default:
        return `You earned ${points} logs ✨`;
    }
  };

  const loadEarnings = async () => {
    // Mock earnings data - in production, this would come from a payments table
    setEarnings({
      total_tips: 0,
      pending_payout: 0,
      total_referrals: 0,
      referral_earnings: 0,
    });
  };

  const handleDeleteStack = async (stackId: string) => {
    if (!confirm('Are you sure you want to delete this stack?')) return;

    const { error } = await supabase
      .from('stacks')
      .delete()
      .eq('id', stackId)
      .eq('profile_id', user!.id);

    if (error) {
      toast.error('Failed to delete stack');
      return;
    }

    toast.success('Stack deleted');
    loadUserStacks();
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          bio,
          github_url: githubUrl,
          twitter_handle: twitterHandle,
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('Settings saved!');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const tabs = [
    { id: 'overview' as DashboardTab, label: 'Overview', icon: LayoutDashboard },
    { id: 'stacks' as DashboardTab, label: 'My Stacks', icon: Layers },
    { id: 'notifications' as DashboardTab, label: 'Notifications', icon: Bell },
    { id: 'earnings' as DashboardTab, label: 'Earnings', icon: DollarSign },
    { id: 'settings' as DashboardTab, label: 'Settings', icon: Settings },
  ];

  if (authLoading) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center">
        <LoadingFire size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <div className="container mx-auto px-4 pt-24 pb-12">
        <div className="flex gap-8">
          {/* Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <Card className="p-4 bg-surface/50 border-white/10 sticky top-24">
              {/* User Info */}
              <div className="flex items-center gap-3 mb-6 pb-6 border-b border-white/10">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback>{profile?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">@{profile?.username || 'User'}</p>
                  <p className="text-sm text-orange-400">{profile?.karma_points || 0} logs</p>
                </div>
              </div>

              {/* Navigation */}
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === tab.id
                        ? 'bg-orange-500/20 text-orange-400'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    {tab.label}
                  </button>
                ))}
              </nav>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Dashboard</h1>

                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-4">
                  <Card className="p-4 bg-surface/50 border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Award className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{profile?.karma_points || 0}</p>
                        <p className="text-sm text-zinc-500">Total Logs</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-surface/50 border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-500/20">
                        <Layers className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stacks.length}</p>
                        <p className="text-sm text-zinc-500">Stacks</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-surface/50 border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <BarChart3 className="w-5 h-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stacks.reduce((sum, s) => sum + (s.view_count || 0), 0)}</p>
                        <p className="text-sm text-zinc-500">Total Views</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-4 bg-surface/50 border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-green-500/20">
                        <TrendingUp className="w-5 h-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold">{stacks.reduce((sum, s) => sum + (s.upvote_count || 0), 0)}</p>
                        <p className="text-sm text-zinc-500">Total Upvotes</p>
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Recent Stacks */}
                <Card className="p-6 bg-surface/50 border-white/10">
                  <h2 className="text-xl font-semibold mb-4">Recent Stacks</h2>
                  {stacks.slice(0, 5).map((stack) => (
                    <div key={stack.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                      <div>
                        <p className="font-medium">{stack.name}</p>
                        <p className="text-sm text-zinc-500">
                          {formatDistanceToNow(new Date(stack.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        {stack.burn_score && (
                          <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                            🔥 {stack.burn_score}
                          </Badge>
                        )}
                        <Button variant="ghost" size="sm" onClick={() => navigate(`/stack/${stack.slug}`)}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {stacks.length === 0 && (
                    <p className="text-zinc-500 text-center py-8">No stacks yet. Submit your first stack!</p>
                  )}
                </Card>
              </div>
            )}

            {/* My Stacks Tab */}
            {activeTab === 'stacks' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="text-3xl font-bold">My Stacks</h1>
                  <Button onClick={() => navigate('/')}>
                    <Flame className="w-4 h-4 mr-2" />
                    Submit New Stack
                  </Button>
                </div>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingFire size="sm" />
                  </div>
                ) : stacks.length > 0 ? (
                  <div className="space-y-4">
                    {stacks.map((stack) => (
                      <Card key={stack.id} className="p-4 bg-surface/50 border-white/10">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-lg">{stack.name}</h3>
                              {!stack.is_public && (
                                <Badge variant="outline" className="text-xs">Private</Badge>
                              )}
                              {stack.burn_score && (
                                <Badge variant="secondary" className="bg-orange-500/20 text-orange-400">
                                  🔥 {stack.burn_score}/100
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-zinc-500">
                              <span className="flex items-center gap-1">
                                <BarChart3 className="w-4 h-4" />
                                {stack.view_count} views
                              </span>
                              <span className="flex items-center gap-1">
                                <TrendingUp className="w-4 h-4" />
                                {stack.upvote_count} upvotes
                              </span>
                              <span>
                                {formatDistanceToNow(new Date(stack.created_at), { addSuffix: true })}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/stack/${stack.slug}`)}>
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300" onClick={() => handleDeleteStack(stack.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 bg-surface/50 border-white/10 text-center">
                    <Layers className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                    <p className="text-zinc-500 mb-4">You haven't submitted any stacks yet</p>
                    <Button onClick={() => navigate('/')}>Submit Your First Stack</Button>
                  </Card>
                )}
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Notifications</h1>

                {loading ? (
                  <div className="flex justify-center py-12">
                    <LoadingFire size="sm" />
                  </div>
                ) : notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <Card key={notification.id} className="p-4 bg-surface/50 border-white/10">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-zinc-200">{notification.message}</p>
                            <p className="text-sm text-zinc-500">
                              {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-12 bg-surface/50 border-white/10 text-center">
                    <Bell className="w-12 h-12 mx-auto mb-4 text-zinc-600" />
                    <p className="text-zinc-500">No notifications yet</p>
                  </Card>
                )}
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Earnings</h1>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-6 bg-surface/50 border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Tips Received</h3>
                    <p className="text-4xl font-bold text-green-400">${earnings.total_tips.toFixed(2)}</p>
                    <p className="text-sm text-zinc-500 mt-2">From community appreciation</p>
                  </Card>

                  <Card className="p-6 bg-surface/50 border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Pending Payout</h3>
                    <p className="text-4xl font-bold text-yellow-400">${earnings.pending_payout.toFixed(2)}</p>
                    <p className="text-sm text-zinc-500 mt-2">Available for withdrawal</p>
                  </Card>

                  <Card className="p-6 bg-surface/50 border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Referrals</h3>
                    <p className="text-4xl font-bold text-blue-400">{earnings.total_referrals}</p>
                    <p className="text-sm text-zinc-500 mt-2">Users referred</p>
                  </Card>

                  <Card className="p-6 bg-surface/50 border-white/10">
                    <h3 className="text-lg font-semibold mb-4">Referral Earnings</h3>
                    <p className="text-4xl font-bold text-orange-400">${earnings.referral_earnings.toFixed(2)}</p>
                    <p className="text-sm text-zinc-500 mt-2">From affiliate links</p>
                  </Card>
                </div>

                <Card className="p-6 bg-surface/50 border-white/10">
                  <h3 className="text-lg font-semibold mb-4">Payout Settings</h3>
                  <p className="text-zinc-500">Coming soon! Connect your payment method to receive payouts.</p>
                </Card>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h1 className="text-3xl font-bold">Settings</h1>

                <Card className="p-6 bg-surface/50 border-white/10">
                  <h3 className="text-lg font-semibold mb-6">Profile Settings</h3>

                  <div className="space-y-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Your username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="github">GitHub URL</Label>
                      <Input
                        id="github"
                        value={githubUrl}
                        onChange={(e) => setGithubUrl(e.target.value)}
                        placeholder="https://github.com/username"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="twitter">Twitter Handle</Label>
                      <Input
                        id="twitter"
                        value={twitterHandle}
                        onChange={(e) => setTwitterHandle(e.target.value)}
                        placeholder="@username"
                      />
                    </div>

                    <Button onClick={handleSaveSettings} disabled={savingSettings}>
                      {savingSettings ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </Card>

                <EmailPreferences />

                <Card className="p-6 bg-surface/50 border-red-500/20">
                  <h3 className="text-lg font-semibold mb-4 text-red-400">Danger Zone</h3>
                  <p className="text-zinc-500 mb-4">Once you delete your account, there is no going back.</p>
                  <Button variant="destructive">Delete Account</Button>
                </Card>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
