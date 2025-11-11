import { ActivityFeed } from "../components/ActivityFeed";
import { ProfileDetails } from "../components/ProfileDetails";
import { ProfileHeader } from "../components/ProfileHeader";
import { ProofOfWorkSection } from "../components/ProofOfWorkSection";
import { SkillsSection } from "../components/SkillsSection";
import { StatsSection } from "../components/StatsSection";

export const metadata = {
  title: "User Profile | Alphland",
  description: "View and manage your professional profile.",
};

interface UserProfileProps {
  username: string;
  // Add more props as needed when connecting to backend
}

export default function UserProfile({ username }: UserProfileProps) {
  // TODO: Replace with actual data from Cloudflare API
  const mockUserData = {
    username: "yy",
    fullName: "Yuanying Li",
    avatarUrl: "/user-avatar.jpg",
    socials: {
      twitter: "https://x.com/yy",
      linkedin: "https://linkedin.com/in/yy",
      github: "https://github.com/yy",
      website: "https://example.com",
    },
    lookingFor: "Freelance Opportunities",
    worksAt: "J_Navi",
    location: "Germany",
    skills: {
      FRONTEND: ["React"],
      BACKEND: ["Javascript", "Python", "C++"],
      BLOCKCHAIN: ["Rust", "Solidity"],
    },
    stats: {
      earned: 0,
      submissions: 0,
      won: 0,
    },
    works: [],
  };

  return (
    <div className="min-h-screen bg-smoked-white dark:bg-light-black">
      <ProfileHeader
        username={mockUserData.username}
        fullName={mockUserData.fullName}
        avatarUrl={mockUserData.avatarUrl}
        socials={mockUserData.socials}
      />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-1 space-y-8">
            <ProfileDetails
              lookingFor={mockUserData.lookingFor}
              worksAt={mockUserData.worksAt}
              location={mockUserData.location}
            />
            <SkillsSection skills={mockUserData.skills} />
            <StatsSection
              earned={mockUserData.stats.earned}
              submissions={mockUserData.stats.submissions}
              won={mockUserData.stats.won}
            />
          </div>

          {/* Right Column */}
          <div className="lg:col-span-2 space-y-8">
            <ProofOfWorkSection works={mockUserData.works} />
            <ActivityFeed />
          </div>
        </div>
      </main>
    </div>
  );
}

// This will be used for server-side data fetching
export async function getServerSideProps(context: any) {
  const { username } = context.params;

  // TODO: Fetch user data from Cloudflare API
  // const userData = await fetchUserProfile(username)

  return {
    props: {
      username,
    },
  };
}
