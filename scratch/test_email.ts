import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sendInvitationEmail } from "../lib/email";

async function run() {
  console.log("Testing Invitation Email...");
  const result = await sendInvitationEmail({
    email: "shaibalsharif@gmail.com",
    firstName: "Shaibal",
    inviteLink: "https://tekarnesha.kinde.com/team_invitation?code=debug_test",
  });

  console.log("Result:", JSON.stringify(result, null, 2));
}

run().catch(console.error);
