import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Loader2, Globe, Eye, EyeOff, Shield } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  userType: z.enum(['student', 'professional'], {
    required_error: 'Please select whether you are a student or professional',
  }),
  company_or_school: z.string().min(2, 'Company or school name is required'),
  role: z.string().min(2, 'Role is required'),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const Register = () => {
  const { register } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPublicProfileDialog, setShowPublicProfileDialog] = useState(false);
  const [makeProfilePublic, setMakeProfilePublic] = useState(true); // Default to public

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      userType: undefined,
      company_or_school: '',
      role: '',
    },
  });

  const userType = form.watch('userType');

  const onSubmit = async (values: RegisterFormValues) => {
    // Show public profile dialog before submitting
    setShowPublicProfileDialog(true);
  };

  const handleConfirmRegistration = async (values: RegisterFormValues) => {
    setIsLoading(true);
    setShowPublicProfileDialog(false);
    try {
      await register(values.name, values.email, values.password, values.company_or_school, values.role, makeProfilePublic);
    } catch (error) {
      // Error is handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Register</CardTitle>
          <CardDescription>Create a new account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="••••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>I am a...</FormLabel>
                    <FormControl>
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant={field.value === 'student' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => {
                            field.onChange('student');
                            form.setValue('company_or_school', '');
                            form.setValue('role', '');
                          }}
                        >
                          Student
                        </Button>
                        <Button
                          type="button"
                          variant={field.value === 'professional' ? 'default' : 'outline'}
                          className="flex-1"
                          onClick={() => {
                            field.onChange('professional');
                            form.setValue('company_or_school', '');
                            form.setValue('role', '');
                          }}
                        >
                          Professional
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {userType && (
                <>
                  <FormField
                    control={form.control}
                    name="company_or_school"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{userType === 'student' ? 'School' : 'Company'}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={userType === 'student' ? 'e.g., Stanford University' : 'e.g., Google'} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Role</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={userType === 'student' ? 'e.g., Computer Science Student' : 'e.g., Software Engineer'} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Continue
              </Button>
            </form>
          </Form>
        </CardContent>
        
        {/* Public Profile Dialog */}
        <Dialog open={showPublicProfileDialog} onOpenChange={setShowPublicProfileDialog}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="h-5 w-5 text-primary" />
                <DialogTitle>Make Your Profile Discoverable?</DialogTitle>
              </div>
              <DialogDescription>
                Help others find and connect with you on Ripple
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Card className="border-primary/50 bg-primary/5">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium mb-2">Your profile will be public by default</p>
                      <p className="text-xs text-muted-foreground mb-2">
                        Only the following information will be visible to others:
                      </p>
                      <ul className="text-xs text-muted-foreground list-disc list-inside space-y-1">
                        <li>Your name</li>
                        <li>School or company</li>
                        <li>Role or profession</li>
                        <li>Industry tags (if you add them)</li>
                        <li>Contact method (only if you choose to share)</li>
                      </ul>
                      <p className="text-xs font-medium text-primary mt-2">
                        ✓ Your contacts, meetings, goals, and other private data are never shared
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {makeProfilePublic ? (
                    <Eye className="h-5 w-5 text-primary" />
                  ) : (
                    <EyeOff className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div>
                    <Label htmlFor="public-toggle" className="font-medium cursor-pointer">
                      Make my profile public
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {makeProfilePublic 
                        ? "Others can find you on the Discover page"
                        : "Your profile will be private"}
                    </p>
                  </div>
                </div>
                <Switch
                  id="public-toggle"
                  checked={makeProfilePublic}
                  onCheckedChange={setMakeProfilePublic}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowPublicProfileDialog(false)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => handleConfirmRegistration(form.getValues())}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Registration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Login
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;
