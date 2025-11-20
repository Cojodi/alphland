import Button from "./Button";
import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";

interface User {
  id: string;
  email: string;
  name?: string;
}

const AuthButton = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      const response = await fetch(`${workerUrl}/api/auth/session`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      console.error("Failed to check auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = () => {
    if (user) {
      // If logged in, go to profile
      router.push("/bounty/profile/edit");
    } else {
      // If not logged in, go to login page
      router.push("/auth/login");
    }
  };

  const handleLogout = async () => {
    try {
      const workerUrl =
        process.env.NEXT_PUBLIC_WORKER_URL || "http://localhost:8787";
      await fetch(`${workerUrl}/api/auth/sign-out`, {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      router.push("/bounty");
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  if (loading) {
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

  if (user) {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-sm text-black dark:text-white hidden lg:inline">
          {user.name || user.email}
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
