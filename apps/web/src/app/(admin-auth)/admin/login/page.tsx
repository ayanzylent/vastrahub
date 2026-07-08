"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { signIn } from "@/lib/auth-client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Lock, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import Link from "next/link";
import { BRAND_CONFIG } from "@/constants";

function AdminLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
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

      // Verify admin role after successful authentication
      try {
        const meRes = await api.get<{ role?: string }>("/api/v1/auth/me");
        const role = meRes.success ? meRes.data?.role : null;

        if (role === "admin" || role === "superadmin") {
          toast.success("Welcome back, admin!");
          // Use full page navigation instead of router.push to ensure
          // the browser sends the session cookie (set on the API domain)
          // with the next request. router.push does a client-side RSC fetch
          // where middleware can't see cross-origin cookies.
          const target = callbackUrl?.startsWith("/admin") ? callbackUrl : "/admin/dashboard";
          window.location.href = target;
        } else {
          toast.error("You don't have admin access");
          setError(
            "This account does not have admin privileges. Please contact a super admin if you believe this is an error."
          );
          setLoading(false);
        }
      } catch {
        toast.error("Failed to verify admin access");
        setError("Could not verify admin permissions. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/30" />
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-chart-2/10 blur-3xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 text-foreground opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(currentColor 1px, transparent 1px), linear-gradient(90deg, currentColor 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-4">
        {/* Admin branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 border border-primary/20 shadow-lg shadow-primary/5">
            <ShieldCheck className="h-8 w-8 text-primary" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold text-foreground tracking-tight">
              Admin Panel
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {BRAND_CONFIG.NAME} Management Console
            </p>
          </div>
        </div>

        {/* Login card */}
        <Card className="w-full border-primary/10 bg-card/80 backdrop-blur-xl shadow-2xl shadow-primary/5">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-heading text-xl text-foreground flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-primary" />
              Secure Login
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your admin credentials to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="admin-email" className="text-foreground">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder={BRAND_CONFIG.DEFAULT_ADMIN_EMAIL}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-muted/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-foreground">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-muted/50 border-primary/10 focus:border-primary/30 focus:ring-primary/20"
                />
              </div>

              <Button
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer"
                size="lg"
                type="submit"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying access...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="mr-2 h-4 w-4" />
                    Sign in to Admin
                  </>
                )}
              </Button>
            </form>

            {/* Back to store link */}
            <div className="mt-6 pt-4 border-t border-primary/10 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to store
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security notice */}
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          This area is restricted to authorized personnel only.
          Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}

function AdminLoginFallback() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-muted/30" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-4">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card className="w-full border-primary/10 bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center pb-4">
            <Skeleton className="h-6 w-36 mx-auto" />
            <Skeleton className="h-4 w-56 mx-auto mt-2" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<AdminLoginFallback />}>
      <AdminLoginForm />
    </Suspense>
  );
}
