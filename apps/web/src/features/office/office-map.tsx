"use client";

import { useState } from "react";
import { divIcon } from "leaflet";
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  ZoomControl,
} from "react-leaflet";
import { useLocale } from "@/i18n/locale-provider";
import { officeLocation } from "./office.config";
import "leaflet/dist/leaflet.css";

const officeIcon = divIcon({
  className: "office-map__marker",
  html: '<span class="office-map__pin"></span>',
  iconSize: [24, 32],
  iconAnchor: [12, 32],
  popupAnchor: [0, -32],
});

export default function OfficeMap({ onRetry }: { onRetry: () => void }) {
  const { locale, t } = useLocale();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  return (
    <div className="office-map" role="region" aria-label={t("officeMap")}>
      {loading && !failed && <p role="status">{t("loadingMap")}</p>}
      {failed && (
        <div className="office-map__error" role="alert">
          <p>{t("mapError")}</p>
          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={onRetry}
          >
            {t("retry")}
          </button>
        </div>
      )}
      <MapContainer
        className="office-map__canvas"
        center={officeLocation.coordinates}
        zoom={officeLocation.zoom}
        zoomControl={false}
        scrollWheelZoom={false}
      >
        <ZoomControl
          key={`zoom-${locale}`}
          zoomInTitle={t("zoomIn")}
          zoomOutTitle={t("zoomOut")}
        />
        <TileLayer
          url={officeLocation.tileUrl}
          attribution={officeLocation.attribution}
          maxZoom={19}
          eventHandlers={{
            loading: () => setLoading(true),
            load: () => setLoading(false),
            tileerror: () => {
              setFailed(true);
              setLoading(false);
            },
          }}
        />
        <Marker
          key={`marker-${locale}`}
          position={officeLocation.coordinates}
          icon={officeIcon}
          title={t("demoOfficeMarker")}
        >
          <Popup closeButton={false}>
            <strong>{t("demoOfficeMarker")}</strong>
            <br />
            {officeLocation.address[locale]}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
