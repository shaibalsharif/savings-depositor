import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
  depositImage: f({ image: { maxFileSize: "1MB" } })
    .onUploadComplete(() => {}),
} satisfies FileRouter;
