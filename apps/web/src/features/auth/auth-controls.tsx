"use client";

import Link from "next/link";
import { LogIn, LogOut } from "lucide-react";
import { useGetSessionQuery, useLogoutMutation } from "@/store/api";
import { useLocale } from "@/i18n/locale-provider";

export function AuthControls() {
  const { t } = useLocale();
  const { data, isFetching, isError, refetch } = useGetSessionQuery();
  const [logout, { isLoading, isError: logoutFailed }] = useLogoutMutation();
  if (!data && isFetching)
    return (
      <span
        className="auth-controls"
        role="status"
        aria-label={t("checkingSession")}
      >
        <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      </span>
    );
  if (!data && isError)
    return (
      <button
        className="auth-controls auth-button btn btn-sm"
        onClick={() => refetch()}
      >
        {t("retry")}
      </button>
    );
  if (!data?.user)
    return (
      <Link
        className="auth-controls auth-button auth-button--primary btn btn-sm"
        href="/login"
      >
        <LogIn size={16} aria-hidden="true" />
        <span>{t("login")}</span>
      </Link>
    );
  return (
    <div className="auth-controls">
      <span className="auth-controls__username">{data.user.username}</span>
      <button
        type="button"
        className="auth-button btn btn-sm"
        disabled={isLoading}
        onClick={() => void logout()}
        aria-label={logoutFailed ? t("logoutRetry") : t("logout")}
        title={logoutFailed ? t("logoutRetry") : t("logout")}
      >
        <LogOut size={16} aria-hidden="true" />
        <span>
          {isLoading
            ? t("loggingOut")
            : logoutFailed
              ? t("logoutRetry")
              : t("logout")}
        </span>
      </button>
      {logoutFailed && (
        <span className="visually-hidden" role="alert">
          {t("logoutError")}
        </span>
      )}
    </div>
  );
}
