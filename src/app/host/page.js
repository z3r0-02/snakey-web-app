"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HostPage() {
  const router = useRouter();

  useEffect(() => {
    localStorage.setItem(
      "user",
      JSON.stringify({ email: "host@platform.local", name: "Host" })
    );
    // In-memory flag marking an active guest host session. It survives the
    // client-side navigation below but is wiped by any full page load.
    window.__hostSession = true;
    router.replace("/game");
  }, [router]);

  return null;
}
