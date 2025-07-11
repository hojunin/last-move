import { auth } from "@/lib/auth";
import GlobalNavClient from "./GlobalNavClient";

export default async function GlobalNav() {
  const session = await auth();

  return (
    <GlobalNavClient
      user={
        session?.user
          ? {
              id: session.user.id!,
              email: session.user.email!,
              name: session.user.name!,
              image: session.user.image || undefined,
            }
          : null
      }
    />
  );
}
