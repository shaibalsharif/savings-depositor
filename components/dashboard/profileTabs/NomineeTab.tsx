"use client";

import { useState, useRef, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUploadThing } from "@/lib/uploadthing";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Upload, X } from "lucide-react";
import { NomineeInfoData, saveNomineeInfo } from "@/lib/actions/profile/profile";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";

interface NomineeTabProps {
  initialInfo: { nomineeInfo: NomineeInfoData | null } | { error: string };
}

export default function NomineeTab({ initialInfo }: NomineeTabProps) {
  const { user } = useKindeAuth();
  const { toast } = useToast();

  const initialForm = {
    name: null,
    relation: null,
    dob: null,
    mobile: null,
    nidNumber: null,
    address: null,
    photo: null,
  };

  const [form, setForm] = useState<NomineeInfoData>(
    "error" in initialInfo ? initialForm : initialInfo.nomineeInfo || initialForm
  );
  const [initialValues, setInitialValues] = useState<NomineeInfoData>(form);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const { startUpload } = useUploadThing("nomineePhoto");

  // Use a useMemo hook to check if the form is "dirty" (has changes)
  const isDirty = useMemo(() => {
    // Check for changes in file
    if (file) return true;

    // Check for changes in other fields
    return Object.keys(form).some(key => {
      const fieldKey = key as keyof NomineeInfoData;
      // Compare current form value to initial value
      return form[fieldKey] !== initialValues[fieldKey];
    });
  }, [form, initialValues, file]);

  const isFieldDisabled = (key: keyof NomineeInfoData) => initialValues[key] !== null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setForm(f => ({ ...f, photo: URL.createObjectURL(selectedFile) }));
  };

  const handleRemovePhoto = () => {
    setFile(null);
    setForm(f => ({ ...f, photo: null }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    setLoading(true);
    try {
      let photoUrl = form.photo;
      if (file) {
        const uploaded = await startUpload([file]);
        if (uploaded?.[0]?.url) {
          photoUrl = uploaded[0].url;
        }
      }

      const payload = { ...form, photo: photoUrl };

      const result = await saveNomineeInfo(user.id, payload);

      if ("error" in result) {
        throw new Error(result.error);
      }

      toast({ title: "Nominee information saved!" });
      setInitialValues(payload);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nominee Info</CardTitle>
        <CardDescription>Nominee Information one-time change</CardDescription>
      </CardHeader>
      <form onSubmit={handleSave}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {["name", "relation", "dob", "mobile", "nidNumber", "address"].map(field => (
              <div key={field} className={field === "address" ? "sm:col-span-2" : ""}>
                <Label>{field === "nidNumber" ? "NID Number" : field.charAt(0).toUpperCase() + field.slice(1)}</Label>
                <Input
                  type={field === "dob" ? "date" : "text"}
                  value={form[field as keyof typeof form] || ""}
                  onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))}
                  disabled={isFieldDisabled(field as keyof NomineeInfoData) || loading}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2 col-span-full">
            <Label>Photo</Label>
            {(file || form.photo) && !isFieldDisabled("photo") ? (
              <div className="relative rounded-md border border-dashed p-4 w-48 mx-auto">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-2"
                  onClick={handleRemovePhoto}
                >
                  <X className="h-4 w-4" />
                </Button>
                <div className="flex flex-col items-center gap-2 text-center">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={file ? URL.createObjectURL(file) : form.photo || ""} />
                    <AvatarFallback>IMG</AvatarFallback>
                  </Avatar>
                  <p className="text-sm text-muted-foreground">Image ready to upload</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
                <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                <div className="mb-2 text-center">
                  <p className="font-medium">Drag and drop your nominee photo</p>
                  <p className="text-sm text-muted-foreground">Supports JPEG/PNG (max 1MB)</p>
                </div>
                <Input
                  id="nominee-photo-file"
                  type="file"
                  className="hidden"
                  accept=".jpeg,.jpg,.png"
                  onChange={handleFileChange}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById("nominee-photo-file")?.click()}
                  disabled={isFieldDisabled("photo") || loading}
                >
                  Select File
                </Button>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button type="submit" disabled={!isDirty || loading} className="w-full sm:w-auto px-8 py-2">
            {loading ? "Saving..." : "Save"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}