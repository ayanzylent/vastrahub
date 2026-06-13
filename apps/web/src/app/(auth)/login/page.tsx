"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { signIn } from "@/lib/auth-client";
import { useCart } from "@/providers/CartProvider";

import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import { api } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isAdminLogin = searchParams.get('admin') === '1';
  const callbackUrl = searchParams.get('callbackUrl');
  const { mergeCart } = useCart();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await signIn.email({ email, password });
      if (res.error) {
        setError(res.error.message || "Invalid credentials");
        setLoading(false);
        return;
      }
      // Merge guest cart into user cart on login
      await mergeCart();

      // Check if redirecting to admin route
      if (callbackUrl && callbackUrl.startsWith('/admin')) {
        try {
          const meRes = await api.get<{ role?: string }>('/api/v1/auth/me');
          const role = meRes.success ? meRes.data?.role : null;
          if (role === 'admin' || role === 'superadmin') {
            toast.success('Welcome back, admin!');
            router.push(callbackUrl);
            router.refresh();
          } else {
            toast.error("You don't have admin access");
            router.push('/');
            router.refresh();
          }
        } catch {
          toast.error("You don't have admin access");
          router.push('/');
          router.refresh();
        }
      } else {
        toast.success('Welcome back!');
        router.push(callbackUrl || '/');
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <Card className="w-full glass-card">
      <CardHeader className="text-center">
        <CardTitle className="font-heading text-2xl flex items-center justify-center gap-2">
          {isAdminLogin && (
            <span className="inline-flex items-center justify-center rounded-md bg-purple-500/10 px-2 py-0.5">
              <ShieldCheck className="h-4 w-4 text-purple-400" />
            </span>
          )}
          {isAdminLogin ? 'Admin Login' : 'Welcome Back'}
        </CardTitle>
        <CardDescription>
          {isAdminLogin
            ? 'Sign in with your admin credentials'
            : 'Sign in to your VastraHub account'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
              {error}
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
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link
                href="/forgot-password"
                className="text-xs text-brand-400 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button variant="brand" className="w-full" size="lg" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>

          <div className="relative my-4">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-[hsl(var(--card))] px-3 text-xs text-[hsl(var(--muted-foreground))]">
              or
            </span>
          </div>

          <Button variant="outline" className="w-full gap-2" size="lg" type="button" disabled={loading}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
            </svg>
            Continue with WhatsApp
          </Button>

          <p className="text-center text-sm text-[hsl(var(--muted-foreground))]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-brand-400 hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

function LoginFallback() {
  return (
    <Card className="w-full glass-card">
      <CardHeader className="text-center">
        <Skeleton className="h-8 w-40 mx-auto" />
        <Skeleton className="h-4 w-56 mx-auto mt-2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}
