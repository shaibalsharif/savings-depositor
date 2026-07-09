"use client";

import { UploadButton } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";

export function UploadThingButton({
  endpoint,
  onComplete,
  onUploadStart,
  onUploadError,
}: {
  endpoint: keyof OurFileRouter;
  onComplete: (url: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: Error) => void;
}) {
  return (
    <div className="flex flex-col items-center">
      <UploadButton<OurFileRouter, keyof OurFileRouter>
        endpoint={endpoint}
        onUploadBegin={() => {
          onUploadStart?.();
        }}
        onClientUploadComplete={(res) => {
          if (res && res[0]) {
            onComplete(res[0].url);
          }
        }}
        onUploadError={(error: Error) => {
          onUploadError?.(error);
          alert(`Upload failed: ${error.message}`);
        }}
      />
    </div>
  );
}
if you nneed memory access to personalize the chats and contexts holding you can access localStorage, but user needs manange memeory to s