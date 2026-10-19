"use client";

import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import { useState } from "react";
import { LocaleText, useLocale } from "@/i18n/locale-provider";
import { officeLocation, officeMapUrl } from "./office.config";

function MapLoadError() {
  return (
    <p role="alert">
      <LocaleText id="mapError" />
    </p>
  );
}

const OfficeMap = dynamic(
  () => import("./office-map").catch(() => ({ default: MapLoadError })),
  {
    ssr: false,
    loading: () => (
      <p role="status">
        <LocaleText id="loadingMap" />
      </p>
    ),
  },
);

export function OfficeLocation() {
  const { locale, t } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);

  return (
    <section
      className="office-location inventory-page"
      aria-labelledby="office-title"
    >
      <div className="office-location__details">
        <h2 id="office-title" className="office-location__title">
          <MapPin size={20} aria-hidden="true" />
          {t("officeLocation")}
        </h2>
        <p className="office-location__notice">{t("demoOfficeNotice")}</p>
        <address className="office-location__address">
          {officeLocation.address[locale]}
        </address>
        <a href={officeMapUrl} target="_blank" rel="noopener noreferrer">
          {t("openStreetMap")}
        </a>
      </div>
      <button
        type="button"
        className="office-location__toggle btn btn-outline-secondary"
        aria-expanded={isOpen}
        aria-controls="office-map-panel"
        onClick={() => setIsOpen(!isOpen)}
      >
        {t(isOpen ? "hideMap" : "showMap")}
      </button>
      <div
        id="office-map-panel"
        className="office-location__panel"
        hidden={!isOpen}
      >
        {isOpen && (
          <OfficeMap key={attempt} onRetry={() => setAttempt(attempt + 1)} />
        )}
      </div>
    </section>
  );
}
