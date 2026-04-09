import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Globe, LogIn, UserPlus, ArrowLeft, KeyRound } from "lucide-react";

type AuthMode = "login" | "signup" | "reset";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) navigate("/admin");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) navigate("/admin");
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) throw error;
        toast({
          title: "পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে ✅",
          description: "আপনার ইমেইল চেক করুন।",
        });
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast({ title: "লগইন সফল! ✅" });
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        toast({
          title: "অ্যাকাউন্ট তৈরি হয়েছে! ✅",
          description: "আপনার ইমেইল ভেরিফাই করুন।",
        });
      }
    } catch (error: any) {
      toast({
        title: "ত্রুটি",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const titles: Record<AuthMode, string> = {
    login: "অ্যাডমিন প্যানেলে লগইন করুন",
    signup: "নতুন অ্যাকাউন্ট তৈরি করুন",
    reset: "পাসওয়ার্ড রিসেট করুন",
  };

  const buttonLabels: Record<AuthMode, string> = {
    login: "লগইন",
    signup: "সাইনআপ",
    reset: "রিসেট লিংক পাঠান",
  };

  const buttonIcons: Record<AuthMode, React.ReactNode> = {
    login: <LogIn className="w-4 h-4" />,
    signup: <UserPlus className="w-4 h-4" />,
    reset: <KeyRound className="w-4 h-4" />,
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center mx-auto mb-3">
            <Globe className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-2xl">সূত্র</CardTitle>
          <CardDescription>{titles[mode]}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="ইমেইল"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {mode !== "reset" && (
              <Input
                type="password"
                placeholder="পাসওয়ার্ড"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            )}
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {buttonIcons[mode]}
              {loading ? "অপেক্ষা করুন..." : buttonLabels[mode]}
            </Button>
          </form>
          <div className="mt-4 text-center space-y-2">
            {mode === "login" && (
              <>
                <button onClick={() => setMode("reset")} className="text-sm text-primary hover:underline block mx-auto">
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
                <button onClick={() => setMode("signup")} className="text-sm text-primary hover:underline block mx-auto">
                  অ্যাকাউন্ট নেই? সাইনআপ করুন
                </button>
              </>
            )}
            {mode === "signup" && (
              <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                অ্যাকাউন্ট আছে? লগইন করুন
              </button>
            )}
            {mode === "reset" && (
              <button onClick={() => setMode("login")} className="text-sm text-primary hover:underline">
                ← লগইনে ফিরে যান
              </button>
            )}
            <div>
              <button
                onClick={() => navigate("/")}
                className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mx-auto"
              >
                <ArrowLeft className="w-3 h-3" /> হোমে ফিরে যান
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
