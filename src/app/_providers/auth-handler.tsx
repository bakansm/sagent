"use client";

import { api } from "@/trpc/react";
import { usePrivy } from "@privy-io/react-auth";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

export default function AuthHandler() {
  const { authenticated, user } = usePrivy();
  const hasProcessedAuth = useRef(false);

  // Use the existing getUser query which automatically creates user if not exists
  const { refetch: refetchUser } = api.user.getUser.useQuery(undefined, {
    enabled: authenticated && !!user?.id,
    retry: 3,
  });

  useEffect(() => {
    // Only process authentication once per session
    if (authenticated && user?.id && !hasProcessedAuth.current) {
      hasProcessedAuth.current = true;

      // Trigger the user creation/fetch
      refetchUser()
        .then((result) => {
          if (result.data) {
            // Only show success toast for new users
            if (result.data.isNewUser) {
              toast.success(
                "Welcome! Your account has been created successfully!",
              );
            }
          } else if (result.error) {
            console.error("Failed to sync user:", result.error);
            toast.error("Failed to sync user data");
          }
        })
        .catch((error) => {
          console.error("Error during user sync:", error);
          toast.error("Failed to sync user data");
        });
    }

    // Reset the flag when user disconnects
    if (!authenticated) {
      hasProcessedAuth.current = false;
    }
  }, [authenticated, user?.id, refetchUser]);

  // This component doesn't render anything
  return null;
}
