"use client";

import Layout from "@/components/Layout";
import { useSession } from "@/lib/auth-client";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

/**
 * Profile index page - redirects to user's profile or shows setup prompt
 * - If user has username: redirect to /bounty/profile/{username}
 * - If user has no username: show prompt to create one
 */
export default function ProfileIndex() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isPending && !session?.user) {
      router.push("/auth/login");
      return;
    }

    if (!session?.user) return;

    const checkUsername = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/users/me", {
          credentials: "include",
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push("/auth/login");
            return;
          }
          // Handle non-JSON responses
          const contentType = response.headers.get("content-type");
          if (!contentType || !contentType.includes("application/json")) {
            console.error("API returned non-JSON response:", response.status);
            setError("服务暂时不可用，请稍后重试");
            setLoading(false);
            return;
          }
          setError("无法加载用户信息");
          setLoading(false);
          return;
        }

        // Validate JSON response
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.error("API returned non-JSON response");
          setError("服务暂时不可用，请稍后重试");
          setLoading(false);
          return;
        }

        const data = await response.json();

        if (data.user?.username) {
          // User has username, redirect to their public profile
          router.push(`/bounty/profile/${data.user.username}`);
        } else {
          // User has no username, stay on this page to show prompt
          setLoading(false);
        }
      } catch (err) {
        console.error("Error checking username:", err);
        setError("加载失败，请稍后重试");
        setLoading(false);
      }
    };

    checkUsername();
  }, [session, isPending, router]);

  if (loading || isPending) {
    return (
      <Layout title="加载中... | Alphland" description="正在加载个人资料">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange mx-auto mb-4"></div>
            <p className="text-light-charcoal dark:text-lightgrey">加载中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="错误 | Alphland" description="加载错误">
        <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="mb-6">
              <svg
                className="w-16 h-16 text-red-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
                {error}
              </h1>
            </div>
            <button
              onClick={() => router.push("/bounty")}
              className="px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors font-medium"
            >
              返回首页
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Show prompt to create username
  return (
    <Layout
      title="创建个人资料 | Alphland"
      description="创建你的Alphland个人资料"
    >
      <div className="min-h-screen bg-smoked-white dark:bg-light-black flex items-center justify-center">
        <div className="max-w-md mx-auto px-4">
          <div className="bg-white dark:bg-hero-dark rounded-2xl shadow-lg p-8 text-center">
            {/* Icon */}
            <div className="mb-6">
              <div className="w-20 h-20 bg-orange/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-orange"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-black dark:text-white mb-2">
                需要先创建用户名
              </h1>
              <p className="text-light-charcoal dark:text-lightgrey">
                设置一个唯一的用户名，让其他人可以查看您的公开个人资料
              </p>
            </div>

            {/* Features */}
            <div className="mb-8 text-left space-y-3">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-black dark:text-white">
                  展示您的技能和项目经验
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-black dark:text-white">
                  追踪您的赏金任务完成记录
                </span>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm text-black dark:text-white">
                  让赏金发布者更容易找到您
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button
                onClick={() => router.push("/bounty/profile/edit")}
                className="w-full px-6 py-3 bg-orange text-white rounded-lg hover:bg-orange/90 transition-colors font-medium"
              >
                立即创建个人资料
              </button>
              <button
                onClick={() => router.push("/bounty")}
                className="w-full px-6 py-3 bg-smoked-white dark:bg-light-black text-black dark:text-white rounded-lg hover:bg-border-grey dark:hover:bg-dark-charcoal transition-colors font-medium"
              >
                稍后再说
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
