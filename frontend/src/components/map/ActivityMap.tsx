import type { Location } from '../../types/activity';

interface ActivityMapProps {
  location: Location;
  title?: string;
}

/**
 * Displays an OpenStreetMap embed for a given location.
 * Uses a simple iframe approach to avoid heavy Leaflet dependencies.
 */
export const ActivityMap = ({ location, title }: ActivityMapProps) => {
  const { latitude, longitude } = location;
  const zoom = 15;
  const markerLabel = encodeURIComponent(title || 'Location');

  // OpenStreetMap embed URL with marker
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${longitude - 0.005}%2C${latitude - 0.003}%2C${longitude + 0.005}%2C${latitude + 0.003}&layer=mapnik&marker=${latitude}%2C${longitude}`;

  // Link for full-screen map
  const fullMapUrl = `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=${zoom}/${latitude}/${longitude}`;

  return (
    <div className="relative">
      <iframe
        title={`Map: ${markerLabel}`}
        width="100%"
        height="256"
        style={{ border: 0 }}
        loading="lazy"
        src={mapUrl}
      />
      <a
        href={fullMapUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 px-3 py-1 bg-base/80 border border-border-light dark:border-border-dark text-gold text-xs hover:bg-base transition-all duration-base ease-elegant"
      >
        大きな地図で見る
      </a>
    </div>
  );
};
