import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

interface Notification {
  id: string;
  user_id: string;
  type: "message" | "event" | "networking" | "stand" | "system";
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  priority: "low" | "medium" | "high";
}

export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userId) return;
    // 1. Load existing notifications
    const loadNotifications = async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading notifications:", error);
      } else if (data) {
        setNotifications(data as Notification[]);
      }
    };

    loadNotifications();

    // 2. Subscribe to real-time notifications
    const channel = supabase
      .channel("realtime:notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public", 
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  // 3. Marquer tout comme lu
  const markAllAsRead = async () => {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)

    if (!error) {
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
    }
  };

  // 4. Supprimer des notifs
  const deleteNotifications = async (ids: string[]) => {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .in("id", ids);

    if (!error) {
      setNotifications((prev) => prev.filter((n) => !ids.includes(n.id)));
    }
  };

  return { notifications, markAllAsRead, deleteNotifications };
}

export const createNotification = async (notification: any[]) => {
  const { error } = await supabase
    .from("notifications")
    .insert(notification);

  if (error) {
    console.error("Error creating notification:", error);
  }
};