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
    async function loadScope() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("student_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setScope({
          level: profile.level || "1",
          term: profile.term || "I",
          section: profile.section || "A",
          fullName: profile.full_name || "",
          studentId: profile.student_id || "",
          email: user.email || "",
        });
      }
      setLoading(false);
    }
    loadScope();
  }, []);

  return { scope, loading };
}
