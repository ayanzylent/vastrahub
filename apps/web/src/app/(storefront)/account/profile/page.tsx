"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Loader2, Mail } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

/** Shape returned by GET /api/v1/user/profile (uses `id`, not `_id`). */
interface ProfileData {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  image: string | null;
  createdAt?: string;
  updatedAt?: string;
}

function getInitials(name: string): string {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  return initials || "U";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      const res = await api.get<ProfileData>("/api/v1/user/profile");
      if (!active) return;
      if (res.success && res.data) {
        setProfile(res.data);
        setName(res.data.name ?? "");
        setPhone(res.data.phone ?? "");
      } else {
        toast.error(res.error || "Failed to load profile");
      }
      setLoading(false);
    }
    loadProfile();
    return () => {
      active = false;
    };
  }, []);

  const isDirty =
    profile !== null &&
    (name.trim() !== (profile.name ?? "") ||
      phone.trim() !== (profile.phone ?? ""));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setSaving(true);
    const res = await api.put<ProfileData>("/api/v1/user/profile", {
      name: name.trim(),
      phone: phone.trim(),
    });
    if (res.success && res.data) {
      setProfile(res.data);
      setName(res.data.name ?? "");
      setPhone(res.data.phone ?? "");
      toast.success("Profile updated successfully");
    } else {
      toast.error(res.error || "Failed to update profile");
    }
    setSaving(false);
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            We couldn&apos;t load your profile. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Identity card */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <Avatar className="h-16 w-16">
            <AvatarImage src={profile.image || ""} alt={profile.name} />
            <AvatarFallback className="bg-primary/15 text-primary text-lg font-semibold">
              {getInitials(profile.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h2 className="font-heading text-lg font-semibold truncate">
              {profile.name}
            </h2>
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground truncate">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              {profile.email}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit form */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>
            Update your name and contact number.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                disabled={saving}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="10-digit mobile number"
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={profile.email} disabled readOnly />
              <p className="text-xs text-muted-foreground">
                Email address cannot be changed.
              </p>
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={saving || !isDirty}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
