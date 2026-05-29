import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export default async function MePage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  redirect(`/users/${session.username}`);
}
