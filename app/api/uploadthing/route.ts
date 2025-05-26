import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core"; // Adjust path if needed

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
