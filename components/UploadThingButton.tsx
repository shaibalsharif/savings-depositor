"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function UploadThingButton({
  endpoint,
  onComplete,
}: {
  endpoint: keyof OurFileRouter;
  onComplete: (url: string) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <UploadButton<OurFileRouter, keyof OurFileRouter>
        endpoint={endpoint}
        onClientUploadComplete={(res) => {
          if (res && res[0]) {
            onComplete(res[0].url);
          }
        }}
        onUploadError={(error: Error) => {
          alert(`Upload failed: ${error.message}`);
        }}
      />
    </div>
  );
}
