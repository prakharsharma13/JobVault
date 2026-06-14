"use client";

import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/auth/auth-client";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HeroCta() {
  const { data: session } = useSession();
  const [mounted, setMounted] = useState(false);

  // Only trust the client-side session after mount so the first client render
  // matches the server HTML (avoids a hydration mismatch).
  useEffect(() => setMounted(true), []);

  const isLoggedIn = mounted && Boolean(session?.user);

  if (isLoggedIn) {
    return (
      <Link href="/dashboard">
        <Button size="lg" className="group h-11 px-6 text-[15px]">
          Go to dashboard
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </Link>
    );
  }

  return (
    <>
      <Link href="/sign-up">
        <Button size="lg" className="group h-11 px-6 text-[15px]">
          Start for free
          <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </Link>
      <Link href="/sign-in">
        <Button size="lg" variant="outline" className="h-11 px-6 text-[15px]">
          Log in
        </Button>
      </Link>
    </>
  );
}
