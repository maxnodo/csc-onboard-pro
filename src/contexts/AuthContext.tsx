import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, Enums } from "@/integrations/supabase/types";

type Profile = Tables<"profiles">;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  roles: Enums<"app_role">[];
  loading: boolean;
  isAdmin: boolean;
  isSuperadmin: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  roles: [],
  loading: true,
  isAdmin: false,
  isSuperadmin: false,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Enums<"app_role">[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    setProfile(data);
  };

  const fetchRoles = async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    setRoles(data?.map((r) => r.role) || []);
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
      await fetchRoles(user.id);
    }
  };

  const loadUserData = async (userId: string, isSignIn: boolean) => {
    try {
      if (isSignIn) {
        const { data: currentProfile } = await supabase
          .from("profiles")
          .select("status")
          .eq("id", userId)
          .single();

        if (currentProfile?.status === "pending_verification") {
          await supabase
            .from("profiles")
            .update({ status: "onboarding_started" })
            .eq("id", userId);
        }
      }
      await fetchProfile(userId);
      await fetchRoles(userId);
    } catch (e) {
      console.error("Error loading user data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          // Defer database calls to avoid deadlock in auth callback
          setTimeout(() => {
            loadUserData(
              session.user.id,
              event === "SIGNED_IN" && !!session.user.email_confirmed_at
            );
          }, 0);
        } else {
          setProfile(null);
          setRoles([]);
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id, false);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setProfile(null);
    setRoles([]);
  };

  const isAdmin = roles.includes("admin") || roles.includes("superadmin");
  const isSuperadmin = roles.includes("superadmin");

  return (
    <AuthContext.Provider value={{ session, user, profile, roles, loading, isAdmin, isSuperadmin, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
