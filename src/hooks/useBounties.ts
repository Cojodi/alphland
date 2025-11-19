/**
 * React hooks for bounty management
 * Provides easy-to-use hooks for fetching and managing bounties
 */
import { apiClient, Bounty, CreateBountyInput } from "@/lib/api-client";
import { useState, useEffect } from "react";

/**
 * Hook to fetch all bounties
 */
export function useBounties() {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBounties = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getBounties();
      setBounties(data.bounties);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch bounties")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounties();
  }, []);

  return { bounties, loading, error, refetch: fetchBounties };
}

/**
 * Hook to fetch a single bounty by ID
 */
export function useBounty(id: string | undefined) {
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBounty = async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.getBounty(id);
      setBounty(data.bounty);
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to fetch bounty")
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBounty();
  }, [id]);

  return { bounty, loading, error, refetch: fetchBounty };
}

/**
 * Hook to create a new bounty
 */
export function useCreateBounty() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createBounty = async (
    data: CreateBountyInput
  ): Promise<Bounty | null> => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.createBounty(data);
      return response.bounty;
    } catch (err) {
      setError(
        err instanceof Error ? err : new Error("Failed to create bounty")
      );
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createBounty, loading, error };
}

/**
 * Hook to filter bounties by status
 */
export function useBountiesByStatus(status: Bounty["status"]) {
  const { bounties, loading, error, refetch } = useBounties();

  const filteredBounties = bounties.filter(
    (bounty) => bounty.status === status
  );

  return { bounties: filteredBounties, loading, error, refetch };
}

/**
 * Hook to filter bounties by category
 */
export function useBountiesByCategory(category: string) {
  const { bounties, loading, error, refetch } = useBounties();

  const filteredBounties = bounties.filter(
    (bounty) => bounty.category === category
  );

  return { bounties: filteredBounties, loading, error, refetch };
}
