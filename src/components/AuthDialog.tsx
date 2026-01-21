import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner"; // CHANGED: Use sonner toast

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  defaultMode?: "signup" | "signin";
}

export function AuthDialog({ open, onOpenChange, onSuccess, defaultMode = "signup" }: AuthDialogProps) {
  const [isSignUp, setIsSignUp] = useState(defaultMode === "signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setIsSignUp(defaultMode === "signup");
      setEmail("");
      setPassword("");
      setUsername("");
    }
  }, [open, defaultMode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        console.log("🚀 Starting SIGN UP process...");
        
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username: username,
            },
          },
        });

        console.log("✅ Sign up response:", signUpData);

        if (signUpError) {
          console.error("❌ Sign up error:", signUpError);
          throw signUpError;
        }

        if (!signUpData.user) {
          throw new Error("No user returned from signup");
        }

        console.log("✅ User created!");

        toast.success(`Welcome ${username}! 🎉`, {
          description: "You're now signed in and ready to submit your stack.",
        });

        setEmail("");
        setPassword("");
        setUsername("");
        setLoading(false);
        onOpenChange(false);

        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 300);
        }
        return;
        
      } else {
        console.log("🔑 Starting SIGN IN process...");
        
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        console.log("✅ Sign in response:", signInData);

        if (signInError) {
          console.error("❌ Sign in error:", signInError);
          throw signInError;
        }

        toast.success("Welcome back! 👋", {
          description: "You're now signed in.",
        });

        setEmail("");
        setPassword("");
        setUsername("");
        setLoading(false);
        onOpenChange(false);

        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 300);
        }
        return;
      }
    } catch (error: any) {
      console.error("❌ Auth error:", error);
      
      let errorMessage = "Something went wrong. Please try again.";
      
      if (error.message.includes("Invalid login credentials")) {
        errorMessage = "Invalid email or password. Please check your credentials.";
      } else if (error.message.includes("Email not confirmed")) {
        errorMessage = "Please verify your email address before signing in.";
      } else if (error.message.includes("User already registered")) {
        errorMessage = "This email is already registered. Please sign in instead.";
      } else if (error.message.includes("duplicate key")) {
        errorMessage = "This username is already taken. Please choose another.";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Use sonner's error toast
      toast.error("Authentication Failed", {
        description: errorMessage,
      });
      
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isSignUp ? "Create Account" : "Sign In"}</DialogTitle>
          <DialogDescription>
            {isSignUp
              ? "Join StackRoast to submit stacks and earn logs"
              : "Welcome back! Sign in to your account"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAuth} className="space-y-4">
          {isSignUp && (
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="johndoe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Loading..." : isSignUp ? "Create Account" : "Sign In"}
          </Button>

          <div className="text-center text-sm">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Sign In" : "Sign Up"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}