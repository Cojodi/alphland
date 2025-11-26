import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSession } from "@/lib/auth-client";
import Layout from "@/components/Layout";
import { Sparkles, Send } from "lucide-react";

export default function AIGenerateBounty() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [sponsor, setSponsor] = useState<any>(null);
  const [loadingSponsor, setLoadingSponsor] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ role: "user" | "assistant"; content: string }>
  >([
    {
      role: "assistant",
      content:
        "Hi! I'll help you create a comprehensive bounty listing. Tell me about the project or task you'd like to create a bounty for.",
    },
  ]);

  useEffect(() => {
    async function fetchSponsorData() {
      if (!session?.user?.id) {
        setLoadingSponsor(false);
        return;
      }

      try {
        const response = await fetch(`/api/sponsors/user/${session.user.id}`);

        if (!response.ok) {
          router.push("/bounty/new/sponsor");
          return;
        }

        const data = await response.json();
        setSponsor(data.sponsor);
      } catch (error) {
        console.error("Error fetching sponsor data:", error);
        router.push("/bounty/new/sponsor");
      } finally {
        setLoadingSponsor(false);
      }
    }

    if (!isPending) {
      fetchSponsorData();
    }
  }, [session, isPending, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;

    const userMessage = prompt;
    setPrompt("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    // TODO: Implement AI bounty generation API
    // This is a placeholder for the AI conversation
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "AI bounty generation is coming soon! For now, please use the manual creation form.",
        },
      ]);
      setLoading(false);
    }, 1000);
  };

  if (loadingSponsor || isPending) {
    return (
      <Layout title="Generate Bounty with AI - Alphland">
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange border-t-transparent mx-auto" />
            <div className="text-xl font-semibold mt-4">Loading...</div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!sponsor) {
    return null;
  }

  return (
    <Layout title="Generate Bounty with AI - Alphland">
      <div className="min-h-screen bg-smoked-white dark:bg-light-black py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="text-light-charcoal dark:text-lightgrey hover:text-orange font-barlow mb-4 flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-orange" />
              <h1 className="text-4xl font-bold text-black dark:text-white font-barlow">
                AI Bounty Generator
              </h1>
            </div>
            <p className="text-lg text-light-charcoal dark:text-lightgrey font-barlow">
              Let AI help you create a comprehensive bounty listing
            </p>
          </div>

          {/* Chat Interface */}
          <div className="bg-white dark:bg-hero-dark rounded-xl border border-border-grey dark:border-dark-charcoal overflow-hidden">
            {/* Messages */}
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === "user"
                        ? "bg-orange text-white"
                        : "bg-smoked-white dark:bg-light-black text-black dark:text-white"
                    }`}
                  >
                    <p className="font-barlow">{message.content}</p>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] rounded-lg p-4 bg-smoked-white dark:bg-light-black">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-orange rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-orange rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      />
                      <div
                        className="w-2 h-2 bg-orange rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              className="border-t border-border-grey dark:border-dark-charcoal p-4"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe your bounty idea..."
                  disabled={loading}
                  className="flex-1 px-4 py-3 bg-smoked-white dark:bg-light-black border border-border-grey dark:border-dark-charcoal rounded-lg text-black dark:text-white font-barlow focus:outline-none focus:ring-2 focus:ring-orange disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={loading || !prompt.trim()}
                  className="px-6 py-3 bg-orange hover:bg-orange/90 text-white rounded-lg font-barlow font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </form>
          </div>

          {/* Notice */}
          <div className="mt-6 bg-orange/10 border border-orange/20 rounded-lg p-4">
            <p className="text-sm text-orange font-barlow">
              <strong>Coming Soon:</strong> AI-powered bounty generation is
              under development. In the meantime, please use the{" "}
              <button
                onClick={() => router.push("/bounty/create/manual")}
                className="underline hover:no-underline"
              >
                manual creation form
              </button>
              .
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
