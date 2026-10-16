"use client";

import { useLocale } from "@/i18n/locale-provider";

import { UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";

interface SessionEvents {
  "sessions:count": (payload: { count: number }) => void;
}

export function SessionCounter() {
  const { t } = useLocale();
  const [count, setCount] = useState<number | null>(null);
  const [isDisconnected, setIsDisconnected] = useState(false);

  useEffect(() => {
    const socket: Socket<SessionEvents> = io(
      process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3001",
      { autoConnect: false },
    );

    function updateCount(payload: { count: number }) {
      if (!Number.isSafeInteger(payload.count) || payload.count < 0) return;
      setCount(payload.count);
      setIsDisconnected(false);
    }

    function markDisconnected() {
      setCount(null);
      setIsDisconnected(true);
    }

    socket.on("sessions:count", updateCount);
    socket.on("disconnect", markDisconnected);
    socket.on("connect_error", markDisconnected);
    socket.connect();

    return () => {
      socket.off("sessions:count", updateCount);
      socket.off("disconnect", markDisconnected);
      socket.off("connect_error", markDisconnected);
      socket.disconnect();
    };
  }, []);

  const label =
    count !== null
      ? t("activeTabs", { count })
      : isDisconnected
        ? t("counterDisconnected")
        : t("counterConnecting");

  return (
    <span
      className={`session-counter${isDisconnected ? " session-counter--disconnected" : ""}`}
      role="status"
      aria-label={label}
      title={label}
    >
      <UsersRound size={18} aria-hidden="true" />
      <span className="session-counter__label" aria-hidden="true">
        {t("tabs")}
      </span>
      <span className="session-counter__value" aria-hidden="true">
        {count ?? "—"}
      </span>
    </span>
  );
}
