import { ExternalLink, MapPin } from "lucide-react";

export interface MapMarker {
  lat?: number;
  lng?: number;
  title: string;
  subtitle?: string;
  mapsUrl?: string;
}

interface Props {
  markers: MapMarker[];
}

const getMapsUrl = (m: MapMarker) => {
  if (m.mapsUrl && m.mapsUrl.trim().startsWith("http")) {
    return m.mapsUrl.trim();
  }
  if (m.lat && m.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${m.lat},${m.lng}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    m.subtitle ? `${m.title}, ${m.subtitle}` : m.title
  )}`;
};

const InstitutionMap = ({ markers }: Props) => {
  if (!markers.length) return null;

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {markers.map((m, idx) => (
        <li key={`${m.title}-${idx}`}>
          <a
            href={getMapsUrl(m)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-3 rounded-xl border bg-card p-4 card-hover"
          >
            <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="min-w-0">
              <span className="block font-medium">{m.title}</span>
              {m.subtitle && (
                <span className="block text-sm text-muted-foreground">{m.subtitle}</span>
              )}
              <span className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-primary">
                Open in Google Maps <ExternalLink className="h-3.5 w-3.5" />
              </span>
            </span>
          </a>
        </li>
      ))}
    </ul>
  );
};

export default InstitutionMap;
