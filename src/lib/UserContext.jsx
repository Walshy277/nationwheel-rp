import { createContext, useContext, useState, useCallback } from "react";
import { supabase, SUPABASE_CONFIGURED } from "./supabase";
import { ensureProfile } from "./uiUtils";
import { fetchGameState } from "./notifications";

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [gameState, setGameState] = useState(null);

  const restoreSession = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      const p = await ensureProfile(session.user);
      if (p) {
        setProfile(p);
        await supabase.from("profiles").update({ last_active_at: new Date().toISOString() }).eq("id", p.id);
      }
    }
    fetchGameState().then(gs => { if (gs) setGameState(gs); });
  }, []);

  const signOut = useCallback(() => {
    supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  }, []);

  const updateProfile = useCallback((nextProfile) => {
    setProfile(nextProfile);
  }, []);

  return (
    <UserContext.Provider value={{ user, profile, gameState, setUser, setProfile, updateProfile, signOut, restoreSession, setGameState }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within UserProvider");
  return ctx;
}
