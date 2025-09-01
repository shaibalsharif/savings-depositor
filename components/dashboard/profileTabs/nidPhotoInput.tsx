// components/dashboard/profileTabs/nidPhotoInput.tsx
// (Complete component assuming its structure)
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

interface NidPhotoInputProps {
  label: string;
  existingImageUrl?: string | undefined;
  onChange: (file: File | null) => void;
  disabled: boolean; // <-- FIX: Add the disabled prop here
}

export default function NidPhotoInput({ label, existingImageUrl, onChange, disabled }: NidPhotoInputProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      onChange(file);
    } else {
      setPreviewUrl(null);
      onChange(null);
    }
  };

  const handleRemove = () => {
    setPreviewUrl(null);
    onChange(null);
  };

  useEffect(() => {
    setPreviewUrl(existingImageUrl || null);
  }, [existingImageUrl]);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {previewUrl ? (
        <div className="relative rounded-md border border-dashed p-4">
          {!disabled && ( // Only show remove button if not disabled
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleRemove}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className="flex flex-col items-center gap-2 text-center">
            
              <Image alt="" width={"100"} height={"65"} src={previewUrl} />
           
            
            <p className="text-sm text-muted-foreground">Image selected</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border border-dashed p-8">
          <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
          <div className="mb-2 text-center">
            <p className="font-medium">Upload {label}</p>
          </div>
          <Input
            id={`nid-${label.toLowerCase()}`}
            type="file"
            className="hidden"
            accept="image/*"
            onChange={handleFileChange}
            ref={fileInputRef}
            disabled={disabled}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            Select File
          </Button>
        </div>
      )}
    </div>
  );
}