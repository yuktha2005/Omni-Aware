import { useState, useEffect } from "react";

export function usePushNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("default");
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator) {
      setIsSupported(true);
      setPermission(Notification.permission);
      if (Notification.permission === "granted") {
        setIsSubscribed(true);
      }
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        setIsSubscribed(true);
        // Optional: show a test notification
        if (navigator.serviceWorker && navigator.serviceWorker.ready) {
          const reg = await navigator.serviceWorker.ready;
          reg.showNotification("Notifications Enabled", {
            body: "You will receive real-time campaign delivery alerts.",
            icon: "/icons/icon-192.png",
          });
        }
        setLoading(false);
        return true;
      }
    } catch (err) {
      console.error("[PWA] Push notification request error:", err);
    }
    setLoading(false);
    return false;
  };

  return {
    isSupported,
    permission,
    isSubscribed,
    loading,
    requestPermission,
  };
}
