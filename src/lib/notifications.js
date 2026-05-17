import { supabase } from "./supabase";

// Parse [mention=user:UUID]text[/mention] and [mention=nation:UUID]text[/mention] from a body string.
export const parseMentions = (body) => {
  const userMentions = [];
  const nationMentions = [];
  if (!body) return { userMentions, nationMentions };
  const userRegex = /\[mention=user:([a-f0-9-]+)\](.*?)\[\/mention\]/gi;
  let match;
  while ((match = userRegex.exec(body)) !== null) {
    userMentions.push({ profileId: match[1], display: match[2] });
  }
  const nationRegex = /\[mention=nation:([a-f0-9-]+)\](.*?)\[\/mention\]/gi;
  while ((match = nationRegex.exec(body)) !== null) {
    nationMentions.push({ nationId: match[1], display: match[2] });
  }
  return { userMentions, nationMentions };
};

// Create a notification row. Returns silently on schema errors (table not set up).
export const createNotification = async ({ profileId, type, title, body, link }) => {
  if (!profileId || !supabase) return;
  const { error } = await supabase.from("notifications").insert({
    profile_id: profileId,
    type: type || "mention",
    title,
    body: body || null,
    link: link || null,
  });
  if (error && /does not exist|could not find|42P01/i.test(error.message || "")) {
    // notifications table not set up yet — silently skip
    return;
  }
  if (error) console.warn("Failed to create notification:", error.message);
};

// Create mention notifications for all @mentions found in a body string.
export const createMentionNotifications = async ({ body, sourceTitle, sourceLink, sourceType = "forum", allProfiles = [] }) => {
  const { userMentions, nationMentions } = parseMentions(body || "");
  for (const m of userMentions) {
    await createNotification({
      profileId: m.profileId,
      type: `${sourceType}_mention`,
      title: `You were mentioned in ${sourceTitle}`,
      body: m.display,
      link: sourceLink,
    });
  }
  // For nation mentions, notify every member of that nation (if we have profiles)
  if (nationMentions.length > 0 && allProfiles.length > 0) {
    for (const nm of nationMentions) {
      const members = allProfiles.filter(p => p.nation_id === nm.nationId);
      for (const member of members) {
        await createNotification({
          profileId: member.id,
          type: `${sourceType}_mention`,
          title: `Your nation was mentioned in ${sourceTitle}`,
          body: nm.display,
          link: sourceLink,
        });
      }
    }
  }
};

// Create a notification for forum thread reply (notifies thread author if different)
export const notifyThreadReply = async ({ thread, replyAuthorId, replyBody, replyLink, threadAuthorId }) => {
  if (replyAuthorId === threadAuthorId) return; // don't notify yourself
  await createNotification({
    profileId: threadAuthorId,
    type: "forum_reply",
    title: `New reply in "${thread.title}"`,
    body: replyBody?.slice(0, 120),
    link: replyLink,
  });
};

// Create notifications for war declaration (notifies defender nation members)
export const notifyWarDeclare = async ({ war, aggressorNationName, allProfiles = [] }) => {
  const defenderId = war.defender_id || war.defender?.id;
  if (!defenderId) return;
  const defenders = allProfiles.filter(p => p.nation_id === defenderId);
  for (const d of defenders) {
    await createNotification({
      profileId: d.id,
      type: "war",
      title: `War declared by ${aggressorNationName}`,
      body: war.name || war.casus_belli?.slice(0, 120),
      link: "/wars",
    });
  }
};

// Create notifications for action status change
export const notifyActionStatus = async ({ action, newStatus, nationId, allProfiles = [] }) => {
  const members = nationId ? allProfiles.filter(p => p.nation_id === nationId) : [];
  for (const m of members) {
    await createNotification({
      profileId: m.id,
      type: "action",
      title: `Action ${newStatus}: "${action.title?.slice(0, 60)}"`,
      body: `Status changed to ${newStatus}`,
      link: "/actions",
    });
  }
};

// Fetch unread notification count for current user
export const fetchUnreadCount = async (profileId) => {
  if (!profileId || !supabase) return 0;
  const { data, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", profileId)
    .eq("read", false);
  if (error && /does not exist|could not find/i.test(error.message || "")) return 0;
  if (error) return 0;
  return data?.length || 0;
};

// Fetch recent notifications for current user
export const fetchNotifications = async (profileId, limit = 20) => {
  if (!profileId || !supabase) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", profileId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error && /does not exist|could not find/i.test(error.message || "")) return [];
  if (error) return [];
  return data || [];
};

// Mark a single notification as read
export const markAsRead = async (notificationId) => {
  if (!notificationId || !supabase) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", notificationId);
  if (error) console.warn("Failed to mark notification read:", error.message);
};

// Mark all notifications as read for a user
export const markAllAsRead = async (profileId) => {
  if (!profileId || !supabase) return;
  const { error } = await supabase
    .from("notifications")
    .update({ read: true })
    .eq("profile_id", profileId)
    .eq("read", false);
  if (error) console.warn("Failed to mark all as read:", error.message);
};

// Fetch game state (day/year)
export const fetchGameState = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("game_state")
    .select("*")
    .eq("id", 1)
    .maybeSingle();
  if (error && /does not exist|could not find/i.test(error.message || "")) return null;
  if (error) return null;
  return data || null;
};

// Advance game day (lore team only)
export const advanceGameDay = async (amount = 1) => {
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("advance_game_day", { amount });
  if (error) {
    if (/does not exist|could not find/i.test(error.message || "")) {
      // Try direct update as fallback
      const { data: current } = await supabase.from("game_state").select("*").eq("id", 1).single();
      if (!current) return null;
      let newDay = (current.game_day || 1) + amount;
      let newYear = current.game_year || 4488;
      while (newDay > 365) { newDay -= 365; newYear += 1; }
      const { error: updateErr } = await supabase
        .from("game_state")
        .update({ game_day: newDay, game_year: newYear, updated_at: new Date().toISOString() })
        .eq("id", 1);
      if (updateErr) return null;
      return { day: newDay, year: newYear };
    }
    console.warn("Failed to advance game day:", error.message);
    return null;
  }
  return data;
};
