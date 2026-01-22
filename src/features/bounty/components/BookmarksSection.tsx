"use client";

import { apiClient } from "@/lib/api-client";
import { Bookmark, Calendar, DollarSign } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

interface BookmarkItem {
  id: string;
  bounty_id: string;
  created_at: number;
  title: string;
  reward_amount: number;
  reward_currency: string;
  status: string;
  end_date: string;
  sponsor_name: string;
  sponsor_logo_url: string | null;
}

interface BookmarksSectionProps {
  userId: string;
}

export function BookmarksSection({ userId }: BookmarksSectionProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBookmarks = async () => {
      try {
        const { bookmarks: data } = await apiClient.getBookmarks(userId);
        setBookmarks(data);
      } catch (error) {
        console.error("Error fetching bookmarks:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBookmarks();
  }, [userId]);

  if (loading) {
    return (
      <section className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-5 h-5 text-orange" />
          <h2 className="text-xl font-bold text-black dark:text-white font-barlow">
            Bookmarked Bounties
          </h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent mx-auto"></div>
          <p className="mt-4 text-light-charcoal dark:text-lightgrey text-sm">
            Loading bookmarks...
          </p>
        </div>
      </section>
    );
  }

  if (bookmarks.length === 0) {
    return (
      <section className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6">
        <div className="flex items-center gap-2 mb-4">
          <Bookmark className="w-5 h-5 text-orange" />
          <h2 className="text-xl font-bold text-black dark:text-white font-barlow">
            Bookmarked Bounties
          </h2>
        </div>
        <div className="text-center py-8">
          <Bookmark className="w-12 h-12 text-light-charcoal mx-auto mb-4 opacity-20" />
          <p className="text-light-charcoal dark:text-lightgrey">
            No bookmarked bounties yet
          </p>
        </div>
      </section>
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-accessible-green/10 text-accessible-green";
      case "closed":
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      case "completed":
        return "bg-orange/10 text-orange";
      default:
        return "bg-light-charcoal/10 text-light-charcoal";
    }
  };

  return (
    <section className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal p-6">
      <div className="flex items-center gap-2 mb-4">
        <Bookmark className="w-5 h-5 text-orange" fill="currentColor" />
        <h2 className="text-xl font-bold text-black dark:text-white font-barlow">
          Bookmarked Bounties
        </h2>
        <span className="ml-auto text-sm text-light-charcoal dark:text-lightgrey">
          {bookmarks.length} {bookmarks.length === 1 ? "bounty" : "bounties"}
        </span>
      </div>

      <div className="space-y-4">
        {bookmarks.map((bookmark) => (
          <Link
            key={bookmark.id}
            href={`/bounty/${bookmark.bounty_id}`}
            className="block p-4 rounded-lg border border-border-grey dark:border-dark-charcoal hover:border-orange hover:shadow-md transition-all duration-300"
          >
            <div className="flex items-start gap-3">
              {/* Sponsor Logo */}
              {bookmark.sponsor_logo_url ? (
                <Image
                  src={bookmark.sponsor_logo_url}
                  alt={bookmark.sponsor_name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-orange/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-orange font-bold text-lg">
                    {bookmark.sponsor_name?.charAt(0).toUpperCase() || "?"}
                  </span>
                </div>
              )}

              <div className="flex-1 min-w-0">
                {/* Title */}
                <h3 className="text-base font-semibold text-black dark:text-white font-barlow mb-1 line-clamp-1">
                  {bookmark.title}
                </h3>

                {/* Sponsor Name */}
                <p className="text-sm text-light-charcoal dark:text-lightgrey mb-2">
                  by {bookmark.sponsor_name}
                </p>

                {/* Meta Info */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  {/* Reward */}
                  <div className="flex items-center gap-1 text-accessible-green font-semibold">
                    <DollarSign className="w-3 h-3" />
                    {bookmark.reward_amount} {bookmark.reward_currency}
                  </div>

                  {/* End Date */}
                  <div className="flex items-center gap-1 text-light-charcoal dark:text-lightgrey">
                    <Calendar className="w-3 h-3" />
                    {formatDate(bookmark.end_date)}
                  </div>

                  {/* Status */}
                  <span
                    className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(bookmark.status)}`}
                  >
                    {bookmark.status.charAt(0).toUpperCase() +
                      bookmark.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
