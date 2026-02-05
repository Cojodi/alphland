"use client";

import DiscordIcon from "@/assets/icons/socials/icon-discord.icon.svg";
import GithubIcon from "@/assets/icons/socials/icon-github.icon.svg";
import LinkedinIcon from "@/assets/icons/socials/icon-linkedin.icon.svg";
import TelegramIcon from "@/assets/icons/socials/icon-telegram.icon.svg";
import TwitterIcon from "@/assets/icons/socials/icon-twitter.icon.svg";
import { Edit, Share2, Globe } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProfileHeaderProps {
  username: string;
  avatarUrl?: string;
  isOwnProfile?: boolean;
  isUsingGoogleNameFallback?: boolean;
  socials?: {
    twitter?: string;
    linkedin?: string;
    github?: string;
    website?: string;
    telegram?: string;
    discord?: string;
  };
}

export function ProfileHeader({
  username,
  avatarUrl,
  isOwnProfile = false,
  isUsingGoogleNameFallback = false,
  socials = {},
}: ProfileHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-orange/10 to-accessible-green/10 dark:from-orange/5 dark:to-accessible-green/5 pt-12 pb-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Username Setup Prompt */}
        {isOwnProfile && isUsingGoogleNameFallback && (
          <div className="mb-6 bg-orange/10 dark:bg-orange/20 border border-orange/30 rounded-lg p-4">
            <p className="text-sm text-orange-800 dark:text-orange-200">
              <span className="font-semibold">Tip:</span> You are currently
              displaying your Google name. Set a unique username to personalize
              your profile!
            </p>
            <Link href="/bounty/profile/edit">
              <span className="inline-block mt-2 text-sm font-medium text-orange hover:underline cursor-pointer">
                Set Username →
              </span>
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end gap-6 mb-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-hero-dark border-4 border-orange/20 shadow-lg overflow-hidden">
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={username}
                  width={96}
                  height={96}
                  className="w-full h-full object-cover"
                  unoptimized={avatarUrl.startsWith("data:")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-orange to-accessible-green text-white text-3xl font-bold">
                  {username[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>

          {/* User Info - Username is the primary identifier */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-black dark:text-white mb-1">
              @{username}
            </h1>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            {isOwnProfile && (
              <Link href="/bounty/profile/edit">
                <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-orange text-white rounded-lg font-medium hover:bg-orange/90 transition-colors w-full sm:w-auto">
                  <Edit size={18} />
                  Edit Profile
                </button>
              </Link>
            )}
            <button
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                alert("Profile link copied!");
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border-2 border-orange text-orange rounded-lg font-medium hover:bg-orange/5 transition-colors w-full sm:w-auto"
            >
              <Share2 size={18} />
              Share
            </button>
          </div>
        </div>

        {/* Social Links */}
        <div className="flex gap-3 pt-4 border-t border-border-grey dark:border-dark-charcoal">
          {socials.github && (
            <a
              href={socials.github}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal flex items-center justify-center text-light-charcoal dark:text-lightgrey hover:border-orange hover:text-orange transition-colors [&_svg]:w-6 [&_svg]:h-6 [&_svg_path]:fill-current"
            >
              <GithubIcon />
            </a>
          )}
          {socials.twitter && (
            <a
              href={socials.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal flex items-center justify-center text-light-charcoal dark:text-lightgrey hover:border-orange hover:text-orange transition-colors [&_svg]:w-6 [&_svg]:h-6 [&_svg_path]:fill-current"
            >
              <TwitterIcon />
            </a>
          )}
          {socials.linkedin && (
            <a
              href={socials.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal flex items-center justify-center text-light-charcoal dark:text-lightgrey hover:border-orange hover:text-orange transition-colors [&_svg]:w-6 [&_svg]:h-6 [&_svg_path]:fill-current"
            >
              <LinkedinIcon />
            </a>
          )}
          {socials.telegram && (
            <a
              href={socials.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal flex items-center justify-center text-light-charcoal dark:text-lightgrey hover:border-orange hover:text-orange transition-colors [&_svg]:w-6 [&_svg]:h-6 [&_svg_path]:fill-current"
            >
              <TelegramIcon />
            </a>
          )}
          {socials.discord && (
            <a
              href={socials.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal flex items-center justify-center text-light-charcoal dark:text-lightgrey hover:border-orange hover:text-orange transition-colors [&_svg]:w-6 [&_svg]:h-6 [&_svg_path]:fill-current"
            >
              <DiscordIcon />
            </a>
          )}
          {socials.website && (
            <a
              href={socials.website}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 rounded-full bg-white dark:bg-hero-dark border border-border-grey dark:border-dark-charcoal flex items-center justify-center text-light-charcoal dark:text-lightgrey hover:border-orange hover:text-orange transition-colors"
            >
              <Globe className="w-6 h-6" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
