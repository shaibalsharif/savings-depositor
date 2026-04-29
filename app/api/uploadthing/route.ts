import { createRouteHandler } from "uploadthing/next";
import { OurFileRouter } from "./core"; // Adjust path if needed

export const { GET, POST } = createRouteHandler({
  router: OurFileRouter,
});
