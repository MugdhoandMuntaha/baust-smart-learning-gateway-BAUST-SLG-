import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface AdminScope {
  level: string;
  term: string;
  section: string;
  fullName: string;
  email: string;
  isSuperAdmin: boolean;
  hasProfile: boolean;
}

export function useAdminScope() {
  const [scope, setScope] = useState<AdminScope | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadScope() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch admin profile
      const { data: profile } = await supabase
        .from("admin_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setScope({
          level: profile.level,
          term: profile.term,
          section: profile.section,
          fullName: profile.full_name || "",
          email: user.email || "",
          isSuperAdmin: false,
          hasProfile: true,
        });
      } else {
        const isSuper = user.email?.includes("super") || user.email === "admin@baust-slg.com";
        setScope({
          level: "1",
          term: "I",
          section: "A",
          fullName: isSuper ? "Super Admin" : "",
          email: user.email || "",
          isSuperAdmin: isSuper,
          hasProfile: false,
        });
      }
      setLoading(false);
    }
    loadScope();
  }, []);

  const updateScope = async (level: string, term: string, section: string, fullName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: new Error("User not found") };

    const payload = {
      id: user.id,
      email: user.email!,
      full_name: fullName,
      level,
      term,
      section,
    };

    const { error } = await supabase
      .from("admin_profiles")
      .upsert(payload);

    if (!error) {
      setScope({
        level,
        term,
        section,
        fullName,
        email: user.email || "",
        isSuperAdmin: false,
        hasProfile: true,
      });
    }
    return { error };
  };

  return { scope, loading, updateScope };
}
