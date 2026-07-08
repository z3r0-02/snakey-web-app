"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GUEST_HOST_EMAIL, setHostSession } from "@/lib/constants";

export default function HostPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem(
      "user",
      JSON.stringify({ email: GUEST_HOST_EMAIL, name: "Host" })
    );
    // Mark an active guest host session. It survives client-side navigation
    // but is wiped when the browser tab is closed (sessionStorage).
    setHostSession(true);
    router.replace("/game");
  }, [router]);

  return null;
}
