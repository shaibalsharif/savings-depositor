import { NextRequest, NextResponse } from "next/server";
import { getKindeManagementToken } from "@/lib/kinde-management";
import { z } from "zod";

export async function GET(req: NextRequest) {
  const token = await getKindeManagementToken();
  const searchParams = req.nextUrl.searchParams;
  const user_id = searchParams.get("user_id"); // Optional single user ID

  let users: any[] = [];

  if (user_id) {
    // Fetch single user using new Kinde API
    const userRes = await fetch(
      `${
        process.env.KINDE_ISSUER_URL
      }/api/v1/users?user_id=${encodeURIComponent(user_id)}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!userRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch user" },
        { status: 500 }
      );
    }

    const json = await userRes.json();

    users = json.users || [];
  } else {
    // Fetch all users
    const usersRes = await fetch(
      `${process.env.KINDE_ISSUER_URL}/api/v1/users?page_size=100`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (!usersRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch users" },
        { status: 500 }
      );
    }

    const json = await usersRes.json();
    users = json.users || [];
  }

  // Enrich with permissions and format the response
  const detailedUsers = await Promise.all(
    users.map(async (user: any) => {
      const permsRes = await fetch(
        `${process.env.KINDE_ISSUER_URL}/api/v1/organizations/${process.env.KINDE_ORG_CODE}/users/${user.id}/permissions`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const permsData = permsRes.ok
        ? await permsRes.json()
        : { permissions: [] };

      return {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        username: user.username,
        email: user.email,
        avatar: user.picture,
        permissions: permsData.permissions?.map((p: any) => p.key) || [],
        status: user.is_suspended ? "archived" : "active",
      };
    })
  );
  return NextResponse.json({ users: detailedUsers });
}

const CreateUserSchema = z.object({
  email: z.string().email(),
  given_name: z.string().min(1, "First name is required"),
  family_name: z.string().min(1, "Last name is required"),
  username: z.string().min(1, "Username is required"),
  picture: z.string().optional(),
  phone: z.string().optional(),
});
export async function POST(req: NextRequest) {
  const body = await req.json();
  const result = CreateUserSchema.safeParse(body);
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return NextResponse.json(
      { error: "Validation failed", details: errors },
      { status: 400 }
    );
  }

  const { email, given_name, family_name, picture, phone, username } =
    result.data;

  const token = await getKindeManagementToken();

  const profile: Record<string, any> = {
    given_name: given_name,
    family_name: family_name,
    ...(picture ? { picture } : {}),
  };

  const identities = [
    {
      type: "email",
      is_verified: true,
      details: {
        email: email,
      },
    },
    {
      type: "username",
      details: {
        username: username.split(" ").join("_").toLowerCase(),
      },
    },
    ...(phone
      ? [
          {
            type: "phone",
            is_verified: false,
            details: {
              phone:
                phone?.includes("+880") || phone?.includes("880")
                  ? phone
                  : phone.charAt(0) == "0"
                  ? `+88${phone}`
                  : `+880${phone}`,
              phone_country_id: "bd", // optionally make this dynamic
            },
          },
        ]
      : []),
  ];

  const res = await fetch(`${process.env.KINDE_ISSUER_URL}/api/v1/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      profile,
      identities,
    }),
  });

  if (!res.ok) {
    const error = await res.json();
    console.log(error);

    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 400 }
    );
  }

  const user = await res.json();
  return NextResponse.json({ user });
}
