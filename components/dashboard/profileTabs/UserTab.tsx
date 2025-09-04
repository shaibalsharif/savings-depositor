"use client";

import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useUploadThing } from "@/lib/uploadthing";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  updateUserTab,
  KindeUser,
} from "@/lib/actions/profile/profile";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface UserTabProps {
  initialProfile: KindeUser | { error: string };
}

export default function UserTab({ initialProfile }: UserTabProps) {
  const { user } = useKindeAuth();
  const { toast } = useToast();

  const isProfileAvailable = !("error" in initialProfile);
  const initialData = isProfileAvailable ? initialProfile : null;

  const [profile, setProfile] = useState<KindeUser | null>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(
    initialData?.picture || null
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { startUpload } = useUploadThing("userImage");

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingSave, setPendingSave] = useState<any | null>(null); // holds formData when modal needed

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0];
    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const handleSave = async (e?: React.FormEvent, confirmed = false) => {
    if (e) e.preventDefault();
    if (!user?.id || !profile) return;

    // If not confirmed yet, check sensitive fields
    if (!confirmed) {
      const userNameChanged = profile.username !== initialData?.username;

      if (userNameChanged) {
        setPendingSave({ ...profile });
        setShowConfirmModal(true);
        return;
      }
    }

    setSaving(true);
    try {
      let pictureUrl = imagePreviewUrl;

      if (selectedFile) {
        setUploading(true);
        const uploaded = await startUpload([selectedFile]);
        if (!uploaded?.[0]?.ufsUrl) {
          throw new Error("Image upload failed");
        }
        pictureUrl = uploaded[0].ufsUrl;
      }

      const updateData = {
        given_name: profile.first_name,
        family_name: profile.last_name,
        picture: pictureUrl,
      };

      const result = await updateUserTab(user.id, updateData);

      if ("error" in result) {
        throw new Error(result.error);
      }

      setProfile(result.user);
      setSelectedFile(null);
      setIsEditing(false);
      toast({ title: "Profile updated successfully" });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setUploading(false);
      setShowConfirmModal(false);
      setPendingSave(null);
    }
  };

  if ("error" in initialProfile) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{initialProfile.error}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!profile) return <>Loading...</>;

  const fullName = `${profile.first_name} ${profile.last_name}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Account Info</CardTitle>
        <CardDescription>user account additional information</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-4 md:space-y-2 md:grid md:grid-cols-2 gap-6">
          {/* Avatar */}
          <div className="flex flex-col items-center w-full">
            {isEditing ? (
              <div className="relative border border-dashed rounded-md p-4 w-48 mx-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={() => {
                    setImagePreviewUrl(profile.picture);
                    setSelectedFile(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage
                      src={imagePreviewUrl || profile.picture || ""}
                    />
                    <AvatarFallback>IMG</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">
                    Image ready to upload
                  </p>
                </div>
              </div>
            ) : (
              <Avatar className="h-32 w-32 ">
                <AvatarImage src={profile.picture || ""} />
                <AvatarFallback>{fullName?.[0] || "U"}</AvatarFallback>
              </Avatar>
            )}
            {isEditing && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="profile-image"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="mt-2"
                >
                  {uploading ? "Uploading..." : "Upload Image"}
                </Button>
              </>
            )}
          </div>

          {/* Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>First Name</Label>
              <Input
                value={profile.first_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, first_name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input
                value={profile.last_name || ""}
                onChange={(e) =>
                  setProfile({ ...profile, last_name: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                value={profile.email || ""}
                // onChange={(e) =>
                //   setProfile({ ...profile, email: e.target.value })
                // }
                disabled={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Mobile</Label>
              <Input
                value={profile.phone || ""}

                // onChange={(e) =>
                //   setProfile({ ...profile, phone: e.target.value })
                // }
                disabled={true}
              />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input
                value={profile.username || ""}
                // onChange={(e) =>
                //   setProfile({ ...profile, username: e.target.value })
                // }
                disabled={true}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 max-w-xl mx-auto lg:-translate-y-32 gap-6">
            <Button
              onClick={(e) => {
                e.preventDefault();
                setIsEditing(!isEditing);
              }}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              {isEditing ? "Cancel" : "Edit"}
            </Button>
            {isEditing && (
              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </CardContent>
      </form>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Changes</DialogTitle>
            <DialogDescription className="space-y-2">
              <p>You are about to update sensitive fields </p>
              {pendingSave?.username !== initialData?.username && (
                <p>Username: <b className="text-red-500  border-[1px] px-[1px] bg-gray-400 bg-opacity-35">{initialData?.username}</b> →
                  <b className="text-green-500 border-[1px] px-[1px] bg-gray-400 bg-opacity-35">{pendingSave?.username}</b><br /></p>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>
              Cancel
            </Button>
            <Button
              onClick={(e) => handleSave(e, true)}
              disabled={saving}
            >
              {saving ? "Saving..." : "Proceed"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
