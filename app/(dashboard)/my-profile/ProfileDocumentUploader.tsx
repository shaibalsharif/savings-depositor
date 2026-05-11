"use client";

import { useState } from "react";
import { UploadThingButton } from "@/components/UploadThingButton";
import { updateMemberDocument } from "@/lib/actions/members";
import { Check, X, Camera, Loader2 } from "lucide-react";

type DocType = "nidFront" | "nidBack" | "nomineePhoto";

export function ProfileDocumentUploader({ 
  userId,
  type, 
  label 
}: { 
  userId: string;
  type: DocType; 
  label: string 
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    if (!previewUrl) return;
    setIsSaving(true);
    try {
      await updateMemberDocument(userId, type, previewUrl);
      setSuccess(true);
      setPreviewUrl(null);
    } catch (err) {
      console.error("Failed to save document:", err);
      alert("Failed to save document. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-green uppercase tracking-wider">
        <Check size={12} /> Uploaded
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {!previewUrl ? (
        <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors gap-2">
          <Camera size={20} className="text-muted-foreground" />
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Upload {label}</p>
          </div>
          <UploadThingButton
            endpoint="userImage"
            onUploadStart={() => setIsUploading(true)}
            onComplete={(url) => {
              setPreviewUrl(url);
              setIsUploading(false);
            }}
            onUploadError={() => setIsUploading(false)}
          />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="relative aspect-[3/2] rounded-lg overflow-hidden border shadow-sm">
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
              <button
                onClick={handleConfirm}
                disabled={isSaving}
                className="p-2 bg-green text-white rounded-full hover:scale-110 transition disabled:opacity-50"
                title="Confirm Upload"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
              </button>
              <button
                onClick={() => setPreviewUrl(null)}
                disabled={isSaving}
                className="p-2 bg-red-500 text-white rounded-full hover:scale-110 transition disabled:opacity-50"
                title="Cancel"
              >
                <X size={18} />
              </button>
            </div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground font-medium italic">
            Click check to confirm or X to cancel
          </p>
        </div>
      )}
      
      {isUploading && (
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 size={14} className="animate-spin text-teal" />
          <span className="text-[10px] font-bold text-teal uppercase tracking-widest">Uploading...</span>
        </div>
      )}
    </div>
  );
}
