"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

export interface Profile {
  id: string;
  name: string;
  created_at: string;
}

export function useProfiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });
    setProfiles((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      refresh();
    });
    const channel = supabase
      .channel("profiles:all")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        refresh();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const createProfile = useCallback(
    async (name: string): Promise<Profile> => {
      const { data, error } = await supabase.from("profiles").insert({ name }).select().single();
      if (error) throw error;
      await refresh();
      return data as Profile;
    },
    [refresh]
  );

  const deleteProfile = useCallback(
    async (id: string) => {
      await supabase.from("profiles").delete().eq("id", id);
      await refresh();
    },
    [refresh]
  );

  return { profiles, loading, refresh, createProfile, deleteProfile };
}
