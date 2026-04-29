// app/api/uploadthing/core.ts
import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const OurFileRouter = {
  depositImage: f({ image: { maxFileSize: "1MB" } }).onUploadComplete(() => {}),
  withdrawalImage: f({ image: { maxFileSize: "1MB" } }).onUploadComplete(() => {}),
  userImage: f({ image: { maxFileSize: "1MB" } }).onUploadComplete(() => {}),
  nomineePhoto: f({ image: { maxFileSize: "1MB" } }).onUploadComplete(() => {}),
  userDocuments: f({ image: { maxFileSize: "1MB" } }).onUploadComplete(
    () => {}
  ), // <-- make sure this exists
} satisfies FileRouter;

export type OurFileRouter = typeof OurFileRouter;
