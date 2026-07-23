import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface StudentScope {
  level: string;
  term: string;
  section: string;
  fullName: string;
  studentId: string;
  email: string;
}

export function useStudentScope() {
  const [scope, setScope] = useState<StudentScope | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchProfile(userId: string, email: string) {
      const { data: profile } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (profile) {
        setScope({
          level: profile.level || "1",
          term: profile.term || "I",
          section: profile.section || "A",
          fullName: profile.full_name || "",
          studentId: profile.student_id || "",
          email: email || "",
        });
      } else {
        setScope(null);
      }
      setLoading(false);
    }

    // Initial check
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        fetchProfile(user.id, user.email || "");
      } else {
        setLoading(false);
      }
    });

    // Listen to changes to handle async session loads in WebViews
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          fetchProfile(session.user.id, session.user.email || "");
        } else {
          setScope(null);
          setLoading(false);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return { scope, loading };
}
