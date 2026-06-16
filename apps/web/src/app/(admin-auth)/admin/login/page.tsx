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
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-primary">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-surface-primary to-slate-900/30" />
        <div className="absolute top-1/4 left-1/4 h-[400px] w-[400px] rounded-full bg-purple-500/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 h-[350px] w-[350px] rounded-full bg-indigo-500/5 blur-3xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-4">
        {/* Admin branding */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 shadow-lg shadow-purple-500/5">
            <ShieldCheck className="h-8 w-8 text-purple-400" />
          </div>
          <div className="text-center">
            <h1 className="font-heading text-2xl font-bold text-white tracking-tight">
              Admin Panel
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              VastraHub Management Console
            </p>
          </div>
        </div>

        {/* Login card */}
        <Card className="w-full border-purple-500/10 bg-surface-secondary/80 backdrop-blur-xl shadow-2xl shadow-purple-500/5">
          <CardHeader className="text-center pb-4">
            <CardTitle className="font-heading text-xl text-white flex items-center justify-center gap-2">
              <Lock className="h-4 w-4 text-purple-400" />
              Secure Login
            </CardTitle>
            <CardDescription className="text-slate-400">
              Enter your admin credentials to continue
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
                <Label htmlFor="admin-email" className="text-slate-300">
                  Email
                </Label>
                <Input
                  id="admin-email"
                  type="email"
                  placeholder="admin@vastrahub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="bg-surface-tertiary/50 border-purple-500/10 focus:border-purple-500/30 focus:ring-purple-500/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password" className="text-slate-300">
                  Password
                </Label>
                <Input
                  id="admin-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="bg-surface-tertiary/50 border-purple-500/10 focus:border-purple-500/30 focus:ring-purple-500/20"
                />
              </div>

              <Button
                className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
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
            <div className="mt-6 pt-4 border-t border-purple-500/10 text-center">
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back to store
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security notice */}
        <p className="text-xs text-slate-600 text-center max-w-xs">
          This area is restricted to authorized personnel only.
          Unauthorized access attempts are logged.
        </p>
      </div>
    </div>
  );
}

function AdminLoginFallback() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface-primary">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-950/40 via-surface-primary to-slate-900/30" />
      </div>
      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-md px-4">
        <div className="flex flex-col items-center gap-3">
          <Skeleton className="h-16 w-16 rounded-2xl" />
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Card className="w-full border-purple-500/10 bg-surface-secondary/80 backdrop-blur-xl">
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
