import { supabase } from "../config/supabase.js";

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getSessionUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function getUserAccess(userId) {
  const { data: profile, error: profileError } = await supabase
    .from("users").select("id,status").eq("id", userId).maybeSingle();
  if (profileError) throw profileError;
  if (!profile || profile.status !== "active") {
    throw new Error("Your user profile is not active. Please contact an administrator.");
  }

  const { data: rows, error: roleError } = await supabase
    .from("user_roles").select("roles(name)").eq("user_id", userId);
  if (roleError) throw roleError;
  const roles = (rows || []).map(row => row.roles?.name).filter(Boolean);
  if (!roles.length) throw new Error("No application role is assigned. Please contact an administrator.");
  return { profile, roles };
}
