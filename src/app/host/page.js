"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { GUEST_HOST_EMAIL, setHostSession } from "@/lib/constants";

export default function HostPage() {
  const router = useRouter();

  useEffect(() => {
    try {
      localStorage.setItem(
        "user",
        JSON.stringify({ email: GUEST_HOST_EMAIL, name: "Host" })
      );
    } catch {
      // localStorage unavailable — can't start a guest session.
    }
    setHostSession(true);
    router.replace("/game");
  }, [router]);

  return null;
}
