"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import {
  getAuthErrorMessage,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  validatePassword,
} from "@/lib/auth-policy";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/common/password-input";
import { Label } from "@/components/ui/label";

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [revokeOtherSessions, setRevokeOtherSessions] = useState(false);
  const [saving, setSaving] = useState(false);

  function reset() {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setRevokeOtherSessions(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    const newPasswordError = validatePassword(newPassword);
    if (newPasswordError) {
      toast.error(newPasswordError);
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword === currentPassword) {
      toast.error("New password must be different from your current password");
      return;
    }

    setSaving(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions,
      });

      if (error) {
        toast.error(getAuthErrorMessage(error, "Failed to change password"));
      } else {
        toast.success(
          revokeOtherSessions
            ? "Password changed. Other devices have been signed out."
            : "Password changed successfully"
        );
        reset();
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold md:text-3xl">Security</h1>
        <p className="mt-1 text-sm text-muted-foreground md:text-base">
          Manage your password and account security.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-primary" />
            Change Password
          </CardTitle>
          <CardDescription>
            Use a strong password you don&apos;t use elsewhere.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <PasswordInput
                id="currentPassword"
                autoComplete="current-password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={saving}
                maxLength={PASSWORD_MAX_LENGTH}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">New Password</Label>
              <PasswordInput
                id="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder={`${PASSWORD_MIN_LENGTH}–${PASSWORD_MAX_LENGTH} characters`}
                disabled={saving}
                maxLength={PASSWORD_MAX_LENGTH}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={saving}
                maxLength={PASSWORD_MAX_LENGTH}
                required
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="revokeOtherSessions"
                type="checkbox"
                className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary"
                checked={revokeOtherSessions}
                onChange={(e) => setRevokeOtherSessions(e.target.checked)}
                disabled={saving}
              />
              <Label
                htmlFor="revokeOtherSessions"
                className="cursor-pointer text-sm font-normal text-muted-foreground"
              >
                Sign out of all other devices
              </Label>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Password
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
