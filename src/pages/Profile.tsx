import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { profileApi, authApi, formatCurrency } from '@/lib/api';
import type { UserProfile } from '@/lib/api';
import { 
  User, Mail, Briefcase, Building2, 
  CreditCard, Edit2, Save, X, LogOut,
  Banknote, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Profile = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const { toast } = useToast();
  const navigate = useNavigate();
  const user = authApi.getUser();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await profileApi.getProfile();
      setProfile(data);
      setFormData(data);
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to load profile', 
        variant: 'destructive' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileApi.patchProfile(formData);
      setProfile(updated);
      setEditing(false);
      toast({ 
        title: 'Success', 
        description: 'Profile updated successfully' 
      });
    } catch (err: any) {
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to update profile', 
        variant: 'destructive' 
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setEditing(false);
  };

  const handleLogout = () => {
    authApi.logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <Layout title="Profile">
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-card rounded-2xl p-4 shadow-card animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout
      title="Profile"
      subtitle="Manage your account and business details"
      headerRight={
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-5 w-5" />
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-2xl font-bold text-primary-foreground">
              {profile?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-foreground">{profile?.name}</h2>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs bg-secondary px-2 py-0.5 rounded-full">
                  {profile?.role}
                </span>
              </div>
            </div>
            {!editing ? (
              <Button
                onClick={() => setEditing(true)}
                variant="outline"
                size="sm"
                className="rounded-xl"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  size="sm"
                  className="rounded-xl bg-success text-success-foreground hover:bg-success/90"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Profile Details */}
        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-2 rounded-xl">
            <TabsTrigger value="personal" className="rounded-lg">Personal Info</TabsTrigger>
            <TabsTrigger value="banking" className="rounded-lg">Banking Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="personal" className="space-y-4 mt-4">
            <Card className="border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name
                  </Label>
                  {editing ? (
                    <Input
                      name="name"
                      value={formData.name || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
                      className="rounded-xl"
                    />
                  ) : (
                    <p className="text-base font-medium text-foreground bg-secondary/50 p-3 rounded-xl">
                      {profile?.name}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address
                  </Label>
                  {editing ? (
                    <Input
                      name="email"
                      type="email"
                      value={formData.email || ''}
                      onChange={handleInputChange}
                      placeholder="Enter your email"
                      className="rounded-xl"
                    />
                  ) : (
                    <p className="text-base font-medium text-foreground bg-secondary/50 p-3 rounded-xl">
                      {profile?.email}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Role
                  </Label>
                  <p className="text-base font-medium text-foreground bg-secondary/50 p-3 rounded-xl capitalize">
                    {profile?.role?.toLowerCase()}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking" className="space-y-4 mt-4">
            <Card className="border-border rounded-2xl">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Banknote className="h-5 w-5 text-primary" />
                  Banking Details
                </CardTitle>
                <CardDescription>
                  Your bank account information for payments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Bank Name
                  </Label>
                  {editing ? (
                    <Input
                      name="bankName"
                      value={formData.bankName || ''}
                      onChange={handleInputChange}
                      placeholder="Enter bank name"
                      className="rounded-xl"
                    />
                  ) : (
                    <p className="text-base font-medium text-foreground bg-secondary/50 p-3 rounded-xl">
                      {profile?.bankName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Account Name
                  </Label>
                  {editing ? (
                    <Input
                      name="accountName"
                      value={formData.accountName || ''}
                      onChange={handleInputChange}
                      placeholder="Enter account name"
                      className="rounded-xl"
                    />
                  ) : (
                    <p className="text-base font-medium text-foreground bg-secondary/50 p-3 rounded-xl">
                      {profile?.accountName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Account Number
                  </Label>
                  {editing ? (
                    <Input
                      name="accountNumber"
                      value={formData.accountNumber || ''}
                      onChange={handleInputChange}
                      placeholder="Enter account number"
                      className="rounded-xl"
                      maxLength={10}
                    />
                  ) : (
                    <p className="text-base font-medium text-foreground bg-secondary/50 p-3 rounded-xl">
                      {profile?.accountNumber}
                    </p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="border-t border-border pt-4">
                <p className="text-xs text-muted-foreground">
                  These details are used for customer payments and transfers
                </p>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Account Stats */}
        <Card className="border-border rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground">User ID</p>
                <p className="text-sm font-mono truncate">{profile?.id}</p>
              </div>
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground">Account Type</p>
                <p className="text-sm font-medium capitalize">{profile?.role?.toLowerCase()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Refresh Button */}
        <div className="flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadProfile}
            className="text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Profile
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;