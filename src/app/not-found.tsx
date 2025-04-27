"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-9xl font-bold text-destructive">404</h1>
      <h2 className="text-3xl font-semibold text-foreground mt-4">
        Oops! Page not found.
      </h2>
      <p className="text-muted-foreground mt-2">
        The page you are looking for does not exist or has been moved.
      </p>
      <Button onClick={() => router.push("/")} className="mt-8">
        Go to Home
      </Button>
    </div>
  );
}