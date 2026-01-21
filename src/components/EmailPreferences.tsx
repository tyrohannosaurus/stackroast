import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Mail, Bell, Users, Newspaper, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { getEmailPreferences, updateEmailPreferences, type EmailType } from '@/lib/emailService';

interface PreferenceSetting {
  key: EmailType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const preferenceSettings: PreferenceSetting[] = [
  {
    key: 'roast_notification',
    label: 'Roast Notifications',
    description: 'Get notified when your stack is roasted',
    icon: <Bell className="w-5 h-5 text-orange-400" />,
  },
  {
    key: 'friend_roast_complete',
    label: 'Friend Roast Updates',
    description: 'Get notified when a friend completes your roast challenge',
    icon: <Users className="w-5 h-5 text-blue-400" />,
  },
  {
    key: 'weekly_digest',
    label: 'Weekly Digest',
    description: 'Receive a weekly roundup of the hottest roasts',
    icon: <Newspaper className="w-5 h-5 text-green-400" />,
  },
];

export function EmailPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<Record<EmailType, boolean>>({
    welcome: true,
    roast_notification: true,
    friend_roast_complete: true,
    weekly_digest: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPreferences, setOriginalPreferences] = useState<Record<EmailType, boolean> | null>(null);

  useEffect(() => {
    async function loadPreferences() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const prefs = await getEmailPreferences(user.id);
        setPreferences(prefs);
        setOriginalPreferences(prefs);
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setLoading(false);
      }
    }

    loadPreferences();
  }, [user]);

  const handleToggle = (key: EmailType, checked: boolean) => {
    const newPreferences = { ...preferences, [key]: checked };
    setPreferences(newPreferences);
    
    // Check if there are changes from original
    if (originalPreferences) {
      const changed = Object.keys(newPreferences).some(
        k => newPreferences[k as EmailType] !== originalPreferences[k as EmailType]
      );
      setHasChanges(changed);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const result = await updateEmailPreferences(user.id, preferences);
      if (result.success) {
        toast.success('Email preferences saved!');
        setOriginalPreferences(preferences);
        setHasChanges(false);
      } else {
        toast.error(result.error || 'Failed to save preferences');
      }
    } catch (error) {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleUnsubscribeAll = async () => {
    if (!user) return;

    const allOff: Record<EmailType, boolean> = {
      welcome: false,
      roast_notification: false,
      friend_roast_complete: false,
      weekly_digest: false,
    };

    setSaving(true);
    try {
      const result = await updateEmailPreferences(user.id, allOff);
      if (result.success) {
        setPreferences(allOff);
        setOriginalPreferences(allOff);
        setHasChanges(false);
        toast.success('Unsubscribed from all emails');
      } else {
        toast.error(result.error || 'Failed to update preferences');
      }
    } catch (error) {
      toast.error('Failed to update preferences');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>
            Sign in to manage your email preferences
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Email Preferences
        </CardTitle>
        <CardDescription>
          Choose which emails you'd like to receive from StackRoast
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email address display */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Mail className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Emails will be sent to: <span className="text-foreground font-medium">{user.email}</span>
          </span>
        </div>

        {/* Preference toggles */}
        <div className="space-y-4">
          {preferenceSettings.map((setting) => (
            <div
              key={setting.key}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">{setting.icon}</div>
                <div>
                  <Label htmlFor={setting.key} className="text-base font-medium cursor-pointer">
                    {setting.label}
                  </Label>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    {setting.description}
                  </p>
                </div>
              </div>
              <Switch
                id={setting.key}
                checked={preferences[setting.key]}
                onCheckedChange={(checked) => handleToggle(setting.key, checked)}
              />
            </div>
          ))}
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleUnsubscribeAll}
            disabled={saving}
            className="text-muted-foreground hover:text-destructive"
          >
            Unsubscribe from all
          </Button>
          
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className="gap-2"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : hasChanges ? (
              'Save Changes'
            ) : (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
