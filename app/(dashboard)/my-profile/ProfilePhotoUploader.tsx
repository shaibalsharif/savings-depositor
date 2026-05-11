"use client";

import { useState } from "react";
import { updateSelfPhoto } from "@/lib/actions/members";
import { UploadThingButton } from "@/components/UploadThingButton";
import { Check, X, Camera, Loader2 } from "lucide-react";

export function ProfilePhotoUploader({ currentPhoto }: { currentPhoto: string }) {
  const [photo, setPhoto] = useState(currentPhoto);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave(urlToSave: string) {
    if (!urlToSave.trim()) return;
    setIsPending(true);
    setMessage("");
    try {
      await updateSelfPhoto(urlToSave);
      setPhoto(urlToSave);
      setPreviewUrl(null);
      setMessage("✓ Photo updated successfully!");
    } catch (err: any) {
      setMessage(`✕ Error: ${err.message}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-4 w-full text-left">
      <div>
        <label className="text-xs font-semibold text-muted-foreground select-none">Update Profile Photo (URL)</label>
        <div className="flex gap-2 mt-1">
          <input
            type="url"
            value={photo}
            onChange={(e) => setPhoto(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="flex-1 min-w-0 bg-muted/30 border p-2 text-xs rounded-lg text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
          />
          <button
            onClick={() => handleSave(photo)}
            disabled={isPending || photo === currentPhoto}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50 select-none flex-shrink-0"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="border-t pt-3 flex flex-col items-center gap-2">
        <label className="text-xs font-semibold text-muted-foreground select-none self-start">Or Upload New Image</label>
        
        {!previewUrl ? (
          <UploadThingButton
            endpoint="userImage"
            onUploadStart={() => setIsUploading(true)}
            onComplete={(url) => {
              setPreviewUrl(url);
              setIsUploading(false);
              setMessage("✓ Preview ready. Confirm or Cancel below.");
            }}
            onUploadError={() => setIsUploading(false)}
          />
        ) : (
          <div className="w-full space-y-3">
            <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-teal shadow-lg">
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                <button
                  onClick={() => handleSave(previewUrl)}
                  disabled={isPending}
                  className="p-1.5 bg-green text-white rounded-full hover:scale-110 transition disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                </button>
                <button
                  onClick={() => {
                    setPreviewUrl(null);
                    setMessage("");
                  }}
                  disabled={isPending}
                  className="p-1.5 bg-red-500 text-white rounded-full hover:scale-110 transition disabled:opacity-50"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <p className="text-[10px] text-center text-muted-foreground font-medium italic">
              Click check to confirm or X to cancel
            </p>
          </div>
        )}

        {isUploading && (
          <div className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin text-teal" />
            <span className="text-[10px] font-bold text-teal uppercase tracking-widest">Uploading...</span>
          </div>
        )}
      </div>

      {message && (
        <p className={`text-xs mt-1 font-semibold ${message.startsWith("✓") ? "text-green" : "text-red"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
