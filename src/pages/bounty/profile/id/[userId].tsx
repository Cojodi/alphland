/**
 * User ID Route - Redirects to username-based profile
 *
 * This route allows accessing profiles by user ID and performs a 301 redirect
 * to the canonical username-based URL.
 *
 * Example: /bounty/profile/id/abc123 -> /bounty/profile/johndoe_x8k2
 */
import { GetServerSideProps } from "next";

export default function UserIdRedirect() {
  // This component should never render - always redirects server-side
  return null;
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { userId } = context.params as { userId: string };

  try {
    // Build the API URL
    const protocol =
      context.req.headers["x-forwarded-proto"] ||
      (context.req.headers.host?.includes("localhost") ? "http" : "https");
    const host = context.req.headers.host || "localhost:3000";
    const baseUrl = `${protocol}://${host}`;

    // Fetch user by ID
    const response = await fetch(`${baseUrl}/api/users/${userId}`);

    if (!response.ok) {
      return { notFound: true };
    }

    const data = await response.json();
    const user = data.user;

    if (!user) {
      return { notFound: true };
    }

    // Redirect to username-based profile
    if (user.username) {
      return {
        redirect: {
          destination: `/bounty/profile/${user.username}`,
          permanent: false, // 307 redirect - username may change
        },
      };
    }

    // User has no username yet - redirect to profile index
    // which will prompt them to set one
    return {
      redirect: {
        destination: "/bounty/profile",
        permanent: false, // 302 redirect - temporary until they set username
      },
    };
  } catch (error) {
    console.error("Error fetching user for redirect:", error);
    return { notFound: true };
  }
};
