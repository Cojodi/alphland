import Button from "./Button";
import { useSession, signOutUser } from "@/lib/auth-client";
import Image from "next/image";
import { useRouter } from "next/router";
import React, { useState, useRef, useEffect } from "react";

interface UserProfile {
  username: string | null;
  image: string | null;
}

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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch user profile to get latest image and username
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!session?.user) {
        setUserProfile(null);
        return;
      }

      try {
        const response = await fetch("/api/users/me");
        if (response.ok) {
          const data = await response.json();
          setUserProfile({
            username: data.user?.username || null,
            image: data.user?.image || null,
          });
        }
      } catch (error) {
        console.error("Failed to fetch user profile:", error);
      }
    };

    fetchUserProfile();
  }, [session?.user]);

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
      setIsDropdownOpen(false);
      await signOutUser();
      // signOutUser already handles redirect to home
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleViewProfile = () => {
    setIsDropdownOpen(false);
    if (userProfile?.username) {
      router.push(`/bounty/profile/${userProfile.username}`);
    } else {
      // If no username set, redirect to edit profile
      router.push("/bounty/profile/edit");
    }
  };

  const handleEditProfile = () => {
    setIsDropdownOpen(false);
    router.push("/bounty/profile/edit");
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
    // Use profile image if available, fallback to session image
    const displayImage = userProfile?.image || session.user.image;
    const displayName = userProfile?.username || session.user.name || "User";

    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-smoked-white dark:hover:bg-white/5 transition-colors"
        >
          {displayImage ? (
            <Image
              src={displayImage}
              alt={displayName}
              width={40}
              height={40}
              className="rounded-full object-cover"
              unoptimized={displayImage.startsWith("data:")}
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-orange flex items-center justify-center text-white font-semibold">
              {(displayName || session.user.email || "U")
                .charAt(0)
                .toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-black dark:text-white">
            {displayName}
          </span>
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal rounded-lg shadow-lg z-50 py-1">
            <button
              onClick={handleViewProfile}
              className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
            >
              My Profile
            </button>
            <button
              onClick={handleEditProfile}
              className="w-full text-left px-4 py-2 text-sm text-black dark:text-white hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
            >
              Edit Profile
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-smoked-white dark:hover:bg-light-black transition-colors"
            >
              Logout
            </button>
          </div>
        )}
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
