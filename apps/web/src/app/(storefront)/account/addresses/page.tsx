"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { INDIAN_STATES } from "@/constants";
import type { IAddress } from "@/types";
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Star,
  Phone,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type AddressForm = {
  label: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

const emptyForm: AddressForm = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "Delhi",
  pincode: "",
  isDefault: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<IAddress[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<AddressForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  async function loadAddresses() {
    setLoading(true);
    const res = await api.get<IAddress[]>("/api/v1/user/addresses");
    if (res.success && res.data) {
      setAddresses(res.data);
    } else {
      toast.error(res.error || "Failed to load addresses");
    }
    setLoading(false);
  }

  useEffect(() => {
    loadAddresses();
  }, []);

  function openAddDialog() {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEditDialog(address: IAddress) {
    setEditingId(address._id);
    setForm({
      label: address.label,
      fullName: address.fullName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? "",
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
    setDialogOpen(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    if (
      !form.label.trim() ||
      !form.fullName.trim() ||
      !form.phone.trim() ||
      !form.addressLine1.trim() ||
      !form.city.trim()
    ) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!/^[0-9]{6}$/.test(form.pincode)) {
      toast.error("Pincode must be a 6-digit number");
      return;
    }

    const payload = {
      ...form,
      addressLine2: form.addressLine2.trim() || undefined,
    };

    setSaving(true);
    const res = editingId
      ? await api.put<IAddress>(`/api/v1/user/addresses/${editingId}`, payload)
      : await api.post<IAddress>("/api/v1/user/addresses", payload);

    if (res.success) {
      toast.success(editingId ? "Address updated" : "Address added");
      setDialogOpen(false);
      await loadAddresses();
    } else {
      toast.error(res.error || "Failed to save address");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    const res = await api.delete(`/api/v1/user/addresses/${id}`);
    if (res.success) {
      toast.success("Address deleted");
      await loadAddresses();
    } else {
      toast.error(res.error || "Failed to delete address");
    }
    setDeletingId(null);
  }

  async function handleSetDefault(id: string) {
    setSettingDefaultId(id);
    const res = await api.put(`/api/v1/user/addresses/${id}/default`);
    if (res.success) {
      toast.success("Default address updated");
      await loadAddresses();
    } else {
      toast.error(res.error || "Failed to set default address");
    }
    setSettingDefaultId(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold md:text-3xl">Addresses</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">
            Manage your delivery addresses.
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-44 w-full rounded-xl" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-14 text-center">
            <MapPin className="mb-4 h-12 w-12 text-muted-foreground/30" />
            <h3 className="font-heading font-semibold">No addresses yet</h3>
            <p className="mb-6 mt-1 text-sm text-muted-foreground">
              Add a delivery address to speed up checkout.
            </p>
            <Button onClick={openAddDialog}>Add Your First Address</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address._id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="mb-3 flex items-center gap-2">
                  <span className="inline-flex items-center rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                    {address.label}
                  </span>
                  {address.isDefault && (
                    <Badge variant="secondary" className="gap-1">
                      <Star className="h-3 w-3 fill-current" />
                      Default
                    </Badge>
                  )}
                </div>

                <p className="font-semibold">{address.fullName}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  {address.addressLine1}
                  {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  <br />
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5" />
                  {address.phone}
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-2 border-t pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5"
                    onClick={() => openEditDialog(address)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {!address.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 gap-1.5"
                      onClick={() => handleSetDefault(address._id)}
                      disabled={settingDefaultId === address._id}
                    >
                      {settingDefaultId === address._id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Star className="h-3.5 w-3.5" />
                      )}
                      Set default
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto h-9 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(address._id)}
                    disabled={deletingId === address._id}
                  >
                    {deletingId === address._id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit Address" : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              Enter the delivery details. Fields marked * are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="label">Label (Home / Work)*</Label>
                <Input
                  id="label"
                  value={form.label}
                  onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))}
                  placeholder="e.g. Home, Office"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Receiver Full Name*</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, fullName: e.target.value }))
                  }
                  placeholder="John Doe"
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="addr-phone">Contact Phone*</Label>
                <Input
                  id="addr-phone"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="10-digit mobile number"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pincode">6-Digit Pincode*</Label>
                <Input
                  id="pincode"
                  value={form.pincode}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, pincode: e.target.value }))
                  }
                  placeholder="e.g. 110001"
                  maxLength={6}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1*</Label>
              <Input
                id="addressLine1"
                value={form.addressLine1}
                onChange={(e) =>
                  setForm((p) => ({ ...p, addressLine1: e.target.value }))
                }
                placeholder="Flat/House No., Building, Street"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
              <Input
                id="addressLine2"
                value={form.addressLine2}
                onChange={(e) =>
                  setForm((p) => ({ ...p, addressLine2: e.target.value }))
                }
                placeholder="Landmark, Area, Colony"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="city">City*</Label>
                <Input
                  id="city"
                  value={form.city}
                  onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                  placeholder="New Delhi"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State*</Label>
                <select
                  id="state"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={form.state}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, state: e.target.value }))
                  }
                >
                  {INDIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                id="isDefault"
                type="checkbox"
                className="h-5 w-5 rounded border-border bg-background text-primary focus:ring-primary"
                checked={form.isDefault}
                onChange={(e) =>
                  setForm((p) => ({ ...p, isDefault: e.target.checked }))
                }
              />
              <Label htmlFor="isDefault" className="cursor-pointer text-sm font-medium">
                Make this my default shipping address
              </Label>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingId ? "Save Changes" : "Add Address"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
