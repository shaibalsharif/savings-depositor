"use client";

import { useState } from "react";
import { updateSelfPhoto } from "@/lib/actions/members";

export function ProfilePhotoUploader({ currentPhoto }: { currentPhoto: string }) {
  const [photo, setPhoto] = useState(currentPhoto);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    if (!photo.trim()) return;
    setIsPending(true);
    setMessage("");
    try {
      await updateSelfPhoto(photo);
      setMessage("✓ Photo updated successfully!");
    } catch (err: any) {
      setMessage(`✕ Error: ${err.message}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="space-y-3 w-full text-left">
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
            onClick={handleSave}
            disabled={isPending || photo === currentPhoto}
            className="px-3 py-2 rounded-lg text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
      {message && (
        <p className={`text-xs mt-1 ${message.startsWith("✓") ? "text-green" : "text-red"}`}>
          {message}
        </p>
      )}
    </div>
  );
}
