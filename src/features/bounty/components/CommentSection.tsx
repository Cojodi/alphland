"use client";

import { notificationService } from "../services/notificationService";
import { apiClient, BountyComment } from "@/lib/api-client";
import { containsProfanity } from "@/lib/profanity-filter";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

interface CommentSectionProps {
  bountyId: string;
  bountyTitle: string;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  sponsorUserId?: string;
  onCommentCount?: (count: number) => void;
}

interface CommentWithReplies extends BountyComment {
  replies?: CommentWithReplies[];
}

function formatTimeAgo(timestamp: string | number): string {
  const date =
    typeof timestamp === "string"
      ? new Date(timestamp)
      : new Date(Number(timestamp) * 1000);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return "just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800)
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 2592000)
    return `${Math.floor(diffInSeconds / 604800)}w ago`;
  return date.toLocaleDateString();
}

function organizeComments(comments: BountyComment[]): CommentWithReplies[] {
  const commentMap = new Map<string, CommentWithReplies>();
  const rootComments: CommentWithReplies[] = [];

  // First pass: create map of all comments
  comments.forEach((comment) => {
    commentMap.set(comment.id, { ...comment, replies: [] });
  });

  // Second pass: organize into tree
  comments.forEach((comment) => {
    const commentWithReplies = commentMap.get(comment.id)!;
    if (comment.parent_comment_id) {
      const parent = commentMap.get(comment.parent_comment_id);
      if (parent) {
        parent.replies = parent.replies || [];
        parent.replies.push(commentWithReplies);
      } else {
        rootComments.push(commentWithReplies);
      }
    } else {
      rootComments.push(commentWithReplies);
    }
  });

  return rootComments;
}

interface SingleCommentProps {
  comment: CommentWithReplies;
  currentUserId?: string;
  currentUsername?: string;
  currentUserAvatar?: string;
  bountyId: string;
  bountyTitle: string;
  sponsorUserId?: string;
  onReply: (parentId: string) => void;
  onUpdate: () => void;
  depth?: number;
}

function SingleComment({
  comment,
  currentUserId,
  currentUsername,
  bountyId,
  bountyTitle,
  sponsorUserId,
  onReply,
  onUpdate,
  depth = 0,
}: SingleCommentProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(comment.user_liked === 1);
  const [likeCount, setLikeCount] = useState(comment.like_count || 0);
  const [isLiking, setIsLiking] = useState(false);

  const isOwner = currentUserId === comment.user_id;

  const handleLike = async () => {
    if (!currentUserId || isLiking) return;
    setIsLiking(true);

    try {
      if (isLiked) {
        const result = await apiClient.unlikeComment(comment.id, currentUserId);
        setLikeCount(result.like_count);
        setIsLiked(false);
      } else {
        const result = await apiClient.likeComment(comment.id, currentUserId);
        setLikeCount(result.like_count);
        setIsLiked(true);

        // Notify comment owner (if not liking own comment)
        if (comment.user_id !== currentUserId) {
          await notificationService.notifyCommentLike(
            comment.user_id,
            bountyId,
            bountyTitle,
            currentUsername,
          );
        }
      }
    } catch (error) {
      console.error("Failed to toggle like:", error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    if (containsProfanity(editContent)) {
      alert("Your comment contains inappropriate language. Please revise it.");
      return;
    }
    try {
      await apiClient.updateComment(comment.id, { content: editContent });
      setIsEditing(false);
      onUpdate();
    } catch (error) {
      console.error("Failed to edit comment:", error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      await apiClient.deleteComment(comment.id);
      onUpdate();
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  return (
    <div
      className={`${
        depth > 0
          ? "ml-8 pl-4 border-l-2 border-border-grey dark:border-dark-charcoal"
          : ""
      }`}
    >
      <div className="flex gap-3 py-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {comment.user_username ? (
            <Link href={`/bounty/profile/${comment.user_username}`}>
              <a className="block">
                {comment.user_avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comment.user_avatar}
                    alt={comment.user_username}
                    className="w-8 h-8 rounded-full object-cover hover:ring-2 hover:ring-orange transition-all"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange/20 to-accessible-green/20 flex items-center justify-center text-sm font-medium text-light-charcoal dark:text-lightgrey hover:ring-2 hover:ring-orange transition-all">
                    {comment.user_username[0].toUpperCase()}
                  </div>
                )}
              </a>
            </Link>
          ) : comment.user_avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={comment.user_avatar}
              alt="User"
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange/20 to-accessible-green/20 flex items-center justify-center text-sm font-medium text-light-charcoal dark:text-lightgrey">
              U
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {comment.user_username ? (
              <Link href={`/bounty/profile/${comment.user_username}`}>
                <a className="font-semibold text-sm text-black dark:text-white hover:text-orange transition-colors">
                  {comment.user_username}
                </a>
              </Link>
            ) : (
              <span className="font-semibold text-sm text-black dark:text-white">
                Anonymous
              </span>
            )}
            <span className="text-xs text-light-charcoal dark:text-lightgrey">
              {formatTimeAgo(comment.created_at)}
            </span>
            {comment.updated_at !== comment.created_at && (
              <span className="text-xs text-light-charcoal dark:text-lightgrey italic">
                (edited)
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50 text-black dark:text-white resize-none"
                rows={3}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleEdit}
                  className="px-3 py-1 text-xs font-medium bg-orange text-white rounded-full hover:bg-primary-dark transition"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  className="px-3 py-1 text-xs font-medium text-light-charcoal hover:text-black dark:text-lightgrey dark:hover:text-white transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-black dark:text-white whitespace-pre-wrap">
              {comment.content}
            </p>
          )}

          {/* Actions */}
          {!isEditing && (
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleLike}
                disabled={!currentUserId || isLiking}
                className={`flex items-center gap-1 text-xs transition ${
                  isLiked
                    ? "text-orange"
                    : "text-light-charcoal dark:text-lightgrey hover:text-orange"
                } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill={isLiked ? "currentColor" : "none"}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {likeCount > 0 && <span>{likeCount}</span>}
              </button>

              {currentUserId && (
                <button
                  onClick={() => onReply(comment.id)}
                  className="text-xs text-light-charcoal dark:text-lightgrey hover:text-orange transition"
                >
                  Reply
                </button>
              )}

              {isOwner && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-xs text-light-charcoal dark:text-lightgrey hover:text-orange transition"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleDelete}
                    className="text-xs text-light-charcoal dark:text-lightgrey hover:text-red-500 transition"
                  >
                    Delete
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          {comment.replies.map((reply) => (
            <SingleComment
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              bountyId={bountyId}
              bountyTitle={bountyTitle}
              sponsorUserId={sponsorUserId}
              onReply={onReply}
              onUpdate={onUpdate}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function CommentSection({
  bountyId,
  bountyTitle,
  currentUserId,
  currentUsername,
  currentUserAvatar,
  sponsorUserId,
  onCommentCount,
}: CommentSectionProps) {
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadComments = useCallback(async () => {
    try {
      const { comments: rawComments } = await apiClient.getCommentsByBounty(
        bountyId,
        currentUserId,
      );
      const organized = organizeComments(rawComments);
      setComments(organized);
      onCommentCount?.(rawComments.length);
    } catch (error) {
      console.error("Failed to load comments:", error);
    } finally {
      setIsLoading(false);
    }
  }, [bountyId, currentUserId, onCommentCount]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId || isSubmitting) return;

    if (containsProfanity(newComment)) {
      alert("Your comment contains inappropriate language. Please revise it.");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await apiClient.createComment({
        bounty_id: bountyId,
        user_id: currentUserId,
        content: newComment,
        parent_comment_id: replyingTo || undefined,
      });

      // Send notifications
      if (replyingTo) {
        // Find the parent comment to get its author
        const findComment = (
          comments: CommentWithReplies[],
          id: string,
        ): CommentWithReplies | null => {
          for (const c of comments) {
            if (c.id === id) return c;
            if (c.replies) {
              const found = findComment(c.replies, id);
              if (found) return found;
            }
          }
          return null;
        };
        const parentComment = findComment(comments, replyingTo);
        if (parentComment && parentComment.user_id !== currentUserId) {
          await notificationService.notifyCommentReply(
            parentComment.user_id,
            bountyId,
            bountyTitle,
            currentUsername,
          );
        }
      } else if (sponsorUserId && sponsorUserId !== currentUserId) {
        // Notify sponsor of new comment (if not muted)
        const shouldNotify = await notificationService.shouldNotify(
          sponsorUserId,
          bountyId,
          "comments",
        );
        if (shouldNotify) {
          await notificationService.notifyNewComment(
            sponsorUserId,
            bountyId,
            bountyTitle,
            currentUsername,
          );
        }
      }

      setNewComment("");
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error("Failed to create comment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (parentId: string) => {
    setReplyingTo(parentId);
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <svg
            className="w-5 h-5 text-light-charcoal dark:text-lightgrey"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          <h3 className="font-semibold text-black dark:text-white">Comments</h3>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="w-8 h-8 bg-smoked-white dark:bg-light-black rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-smoked-white dark:bg-light-black rounded w-1/4" />
                <div className="h-3 bg-smoked-white dark:bg-light-black rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <svg
          className="w-5 h-5 text-light-charcoal dark:text-lightgrey"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h3 className="font-semibold text-black dark:text-white">
          {comments.length} Comment{comments.length !== 1 ? "s" : ""}
        </h3>
      </div>

      {/* Comment Input */}
      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mb-6">
          {replyingTo && (
            <div className="flex items-center gap-2 mb-2 text-sm text-light-charcoal dark:text-lightgrey">
              <span>Replying to comment</span>
              <button
                type="button"
                onClick={cancelReply}
                className="text-orange hover:text-primary-dark"
              >
                Cancel
              </button>
            </div>
          )}
          <div className="flex gap-3">
            {currentUserAvatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentUserAvatar}
                alt={currentUsername || "You"}
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange/20 to-accessible-green/20 flex items-center justify-center text-sm font-medium text-light-charcoal dark:text-lightgrey flex-shrink-0">
                {(currentUsername || "U")[0].toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a comment..."
                className="w-full px-4 py-3 text-sm bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg focus:outline-none focus:ring-2 focus:ring-orange/50 text-black dark:text-white placeholder-light-charcoal dark:placeholder-lightgrey resize-none"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!newComment.trim() || isSubmitting}
                  className="px-4 py-2 text-sm font-medium bg-orange text-white rounded-full hover:bg-primary-dark transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? "Posting..."
                    : replyingTo
                      ? "Reply"
                      : "Post Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-smoked-white dark:bg-light-black rounded-lg text-center">
          <p className="text-sm text-light-charcoal dark:text-lightgrey">
            Please sign in to leave a comment
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="divide-y divide-border-grey dark:divide-dark-charcoal">
        {comments.length === 0 ? (
          <p className="text-center py-8 text-light-charcoal dark:text-lightgrey">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment) => (
            <SingleComment
              key={comment.id}
              comment={comment}
              currentUserId={currentUserId}
              currentUsername={currentUsername}
              bountyId={bountyId}
              bountyTitle={bountyTitle}
              sponsorUserId={sponsorUserId}
              onReply={handleReply}
              onUpdate={loadComments}
            />
          ))
        )}
      </div>
    </div>
  );
}
