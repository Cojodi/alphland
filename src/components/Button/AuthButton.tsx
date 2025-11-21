import Button from "./Button";
import { useSession, signOutUser } from "@/lib/auth-client";
import { useRouter } from "next/router";
import React from "react";

/**
 * AuthButton - Handles login/logout display in the header
 *
 * Uses authClient which sends requests through Next.js proxy:
 * - Frontend: /api/auth/* -> Next.js rewrite -> Worker at :8787
 * - Cookies are set on the frontend domain (localhost:3000)
 */
const AuthButton = () => {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  const handleAuth = () => {
    if (session?.user) {
      // If logged in, go to profile
      router.push("/bounty/profile/edit");
    } else {
      // If not logged in, go to login page
      router.push("/auth/login");
    }
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      // signOutUser already handles redirect to home
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  if (isPending) {
    return (
      <Button
        variant="primary"
        className="h-min"
        style={{ padding: "13px 24px", lineHeight: "normal" }}
        disabled
      >
        Loading...
      </Button>
    );
  }

  if (session?.user) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm text-black dark:text-white hidden lg:inline">
          {session.user.name || session.user.email}
        </span>
        <Button
          variant="secondary"
          className="h-min"
          style={{ padding: "13px 24px", lineHeight: "normal" }}
          onClick={handleLogout}
        >
          Logout
        </Button>
      </div>
    );
  }

  return (
    <Button
      variant="primary"
      className="h-min"
      style={{ padding: "13px 24px", lineHeight: "normal" }}
      onClick={handleAuth}
    >
      Login / Sign up
    </Button>
  );
};

export default AuthButton;
