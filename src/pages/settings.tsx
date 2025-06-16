import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { useState } from 'react';
import { useAuth } from '../hooks/use-auth';
// Removed unused main layout

// Form states
interface ProfileFormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  bio: string;
}

interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  taskUpdates: boolean;
  marketingEmails: boolean;
  newMessages: boolean;
  bidUpdates: boolean;
}

interface SecuritySettings {
  twoFactorAuth: boolean;
  loginAlerts: boolean;
}

const Settings = () => {
  const { user } = useAuth();
  
  // Initialize form state with user data or defaults
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    firstName: (user as any)?.firstName ?? '',
    lastName: (user as any)?.lastName ?? '',
    email: (user as any)?.email ?? '',
    phone: (user as any)?.phone ?? '',
    bio: (user as any)?.bio ?? '',
  });
  
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    taskUpdates: true,
    marketingEmails: false,
    newMessages: true,
    bidUpdates: true,
  });
  
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    twoFactorAuth: false,
    loginAlerts: true,
  });
  
  // Handle profile form changes
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle notification toggle changes
  const handleNotificationChange = (key: keyof NotificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Handle security toggle changes
  const handleSecurityChange = (key: keyof SecuritySettings) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };
  
  // Save profile changes
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    // Would send API request here in a real implementation
    toast({

      title: "Profile Updated",
      description: "Your profile information has been updated successfully.",
      variant: "default",
    });
  };
  
  // Save notification settings
  const handleSaveNotifications = (e: React.FormEvent) => {
    e.preventDefault();
    // Would send API request here in a real implementation
    toast({

      title: "Notification Settings Updated",
      description: "Your notification preferences have been saved.",
      variant: "default",
    });
  };
  
  // Save security settings
  const handleSaveSecurity = (e: React.FormEvent) => {
    e.preventDefault();
    // Would send API request here in a real implementation
    toast({

      title: "Security Settings Updated",
      description: "Your security preferences have been saved.",
      variant: "default",
    });
  };
  
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-[hsl(206,33%,16%)] mb-6">Account Settings</h1>
        
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
          </TabsList>
          
          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-4">Personal Information</h2>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input 
                      id="firstName"
                      name="firstName"
                      value={profileForm.firstName}
                      onChange={handleProfileChange}
                      className="border-[hsl(215,16%,80%)]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input 
                      id="lastName"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                      className="border-[hsl(215,16%,80%)]"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email"
                    name="email"
                    type="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    className="border-[hsl(215,16%,80%)]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    className="border-[hsl(215,16%,80%)]"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <textarea 
                    id="bio"
                    name="bio"
                    value={profileForm.bio}
                    onChange={handleProfileChange}
                    rows={4}
                    placeholder="Tell us about yourself"
                    title="Your professional bio"
                    aria-label="Bio"
                    className="w-full p-2 border border-[hsl(215,16%,80%)] rounded-md focus:outline-none focus:ring-2 focus:ring-[hsl(196,80%,43%)]"
                  />
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)]">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-4">Notification Preferences</h2>
              <form onSubmit={handleSaveNotifications} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Email Notifications</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Receive notifications via email</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.emailNotifications}
                      onCheckedChange={() => handleNotificationChange('emailNotifications')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Push Notifications</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Receive notifications on your device</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.pushNotifications}
                      onCheckedChange={() => handleNotificationChange('pushNotifications')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Task Updates</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Get notified about changes to your tasks</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.taskUpdates}
                      onCheckedChange={() => handleNotificationChange('taskUpdates')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Marketing Emails</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Receive promotional content and offers</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.marketingEmails}
                      onCheckedChange={() => handleNotificationChange('marketingEmails')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">New Messages</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Get notified when you receive new messages</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.newMessages}
                      onCheckedChange={() => handleNotificationChange('newMessages')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Bid Updates</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Get notified about bid status changes</p>
                    </div>
                    <Switch 
                      checked={notificationSettings.bidUpdates}
                      onCheckedChange={() => handleNotificationChange('bidUpdates')}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)]">
                    Save Preferences
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
          
          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-4">Security Settings</h2>
              <form onSubmit={handleSaveSecurity} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Change Password</h3>
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Current Password</Label>
                      <Input 
                        id="currentPassword"
                        type="password"
                        className="border-[hsl(215,16%,80%)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input 
                        id="newPassword"
                        type="password"
                        className="border-[hsl(215,16%,80%)]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm New Password</Label>
                      <Input 
                        id="confirmPassword"
                        type="password"
                        className="border-[hsl(215,16%,80%)]"
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-6" />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Two-Factor Authentication</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Add an extra layer of security to your account</p>
                    </div>
                    <Switch 
                      checked={securitySettings.twoFactorAuth}
                      onCheckedChange={() => handleSecurityChange('twoFactorAuth')}
                    />
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Login Alerts</h3>
                      <p className="text-sm text-[hsl(220,14%,46%)]">Get notified about new login attempts</p>
                    </div>
                    <Switch 
                      checked={securitySettings.loginAlerts}
                      onCheckedChange={() => handleSecurityChange('loginAlerts')}
                    />
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button type="submit" className="bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)]">
                    Save Security Settings
                  </Button>
                </div>
              </form>
            </Card>
          </TabsContent>
          
          {/* Billing Tab */}
          <TabsContent value="billing">
            <Card className="p-6">
              <h2 className="text-xl font-semibold text-[hsl(206,33%,16%)] mb-4">Billing & Payments</h2>
              <div className="space-y-6">
                <div className="bg-[hsl(215,16%,95%)] p-4 rounded-md">
                  <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Current Plan</h3>
                  <p className="text-sm text-[hsl(220,14%,46%)]">Free Plan</p>
                  <p className="text-sm text-[hsl(220,14%,46%)]">Up to 5 tasks per month</p>
                  <Button className="mt-2 bg-[hsl(196,80%,43%)] hover:bg-[hsl(196,80%,38%)]">
                    Upgrade Plan
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Payment Methods</h3>
                  <p className="text-sm text-[hsl(220,14%,46%)]">No payment methods added yet.</p>
                  <Button variant="outline" className="mt-2 border-[hsl(215,16%,80%)]">
                    Add Payment Method
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-md font-medium text-[hsl(206,33%,16%)]">Billing History</h3>
                  <p className="text-sm text-[hsl(220,14%,46%)]">No billing history available.</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
