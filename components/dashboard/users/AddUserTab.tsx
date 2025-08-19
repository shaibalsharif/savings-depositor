// components/dashboard/users/AddUserTab.tsx
"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addNewUser } from "@/lib/actions/users/users";
import { useUploadThing } from "@/lib/uploadthing";
import { Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useRouter } from "next/navigation";

export default function AddUserTab({ onUpdate }: { onUpdate: () => void }) {
  const router = useRouter();
  const { toast } = useToast();
  const { startUpload } = useUploadThing("userImage");
  const [addUserForm, setAddUserForm] = useState({
    email: "",
    given_name: "",
    family_name: "",
    username: "",
    phone: "",
    picture: "",
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setSelectedFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreviewUrl(null);
  };

  const handleAddUser = async () => {
    if (!addUserForm.email || !addUserForm.given_name || !addUserForm.family_name || !addUserForm.username) {
      toast({ title: "Required fields missing", variant: "destructive" });
      return;
    }
    setAddUserLoading(true);
    try {
      let pictureUrl = addUserForm.picture;
      if (!pictureUrl && selectedFile) {
        const res = await startUpload([selectedFile]);
        if (res?.[0]?.ufsUrl) {
          pictureUrl = res[0].ufsUrl;
        }
      }

      const res = await addNewUser({
        ...addUserForm,
        picture: pictureUrl,
      });

      if ("error" in res) {
        throw new Error(res.error);
      }
      toast({ title: "User added successfully" });
      setAddUserForm({
        email: "",
        given_name: "",
        family_name: "",
        username: "",
        phone: "",
        picture: "",
      });
      handleRemoveImage();
      onUpdate();
      router.push('/dashboard/users?tab=active');
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New User</CardTitle>
        <CardDescription>
          Enter details to invite a new user. They will receive a passwordless sign-in email.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 ">
        <div className="grid md:grid-cols-2 gap-4  md:w-full">
          <div>
            <Label>Email*</Label>
            <Input
              type="email"
              value={addUserForm.email}
              onChange={e => setAddUserForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>First Name*</Label>
            <Input
              value={addUserForm.given_name}
              onChange={e => setAddUserForm(f => ({ ...f, given_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Last Name*</Label>
            <Input
              value={addUserForm.family_name}
              onChange={e => setAddUserForm(f => ({ ...f, family_name: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Username*</Label>
            <Input
              value={addUserForm.username}
              onChange={e => setAddUserForm(f => ({ ...f, username: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={addUserForm.phone}
              type="tel"
              onChange={e => setAddUserForm(f => ({ ...f, phone: e.target.value }))}
            />
          </div>
          <div className="col-span-full">
            <Label>Profile Image</Label>
            {imagePreviewUrl ? (
              <div className="relative rounded-md border border-dashed p-4 w-48 mx-auto">
                <Button type="button" variant="ghost" size="icon" className="absolute right-2 top-2" onClick={handleRemoveImage}>
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={imagePreviewUrl} />
                    <AvatarFallback>IMG</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Image ready to upload</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <div className="mb-2 text-center">
                  <p className="font-medium">Upload your profile image</p>
                  <p className="text-sm text-muted-foreground">Supports JPEG, PNG (max 1MB)</p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  id="profile-image"
                />
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={addUserLoading}>
                  Select Image
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={handleAddUser} disabled={addUserLoading || !addUserForm.email || !addUserForm.given_name || !addUserForm.family_name || !addUserForm.username}>
          {addUserLoading ? "Adding..." : "Add User"}
        </Button>
      </CardFooter>
    </Card>
  );
}