import type { Activity } from '../../types/activity';

interface ActivitiesMapProps {
  activities: Activity[];
}

/**
 * Shows multiple activities on a single OpenStreetMap embed.
 * Since iframe embeds don't support multiple custom markers well,
 * we compute a bounding box from all activities and show the area.
 * Each activity is listed below with a link.
 */
export const ActivitiesMap = ({ activities }: ActivitiesMapProps) => {
  const locatedActivities = activities.filter(
    (a) => a.location && a.location.latitude && a.location.longitude
  );

  if (locatedActivities.length === 0) {
    return (
      <div className="h-64 bg-elevated-light dark:bg-elevated-dark flex items-center justify-center">
        <p className="text-sm text-text-secondary dark:text-text-dark-muted">
          位置情報のあるアクティビティがありません
        </p>
      </div>
    );
  }

  // Calculate bounding box
  const lats = locatedActivities.map((a) => a.location.latitude);
  const lngs = locatedActivities.map((a) => a.location.longitude);
  const minLat = Math.min(...lats) - 0.01;
  const maxLat = Math.max(...lats) + 0.01;
  const minLng = Math.min(...lngs) - 0.01;
  const maxLng = Math.max(...lngs) + 0.01;

  // Center for a single-marker fallback
  const centerLat = (minLat + maxLat) / 2;
  const centerLng = (minLng + maxLng) / 2;

  const mapUrl =
    locatedActivities.length === 1
      ? `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${lats[0]}%2C${lngs[0]}`
      : `https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik`;

  const fullMapUrl = `https://www.openstreetmap.org/#map=13/${centerLat}/${centerLng}`;

  return (
    <div className="space-y-4">
      <div className="relative">
        <iframe
          title="Activities Map"
          width="100%"
          height="400"
          style={{ border: 0 }}
          loading="lazy"
          src={mapUrl}
        />
        <a
          href={fullMapUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 px-3 py-1 bg-base/80 border border-border-dark text-gold text-xs hover:bg-base transition-all duration-base ease-elegant"
        >
          大きな地図で見る
        </a>
      </div>

      {/* Activity pins legend */}
      <div className="grid gap-2">
        {locatedActivities.map((activity) => (
          <a
            key={activity.activityId}
            href={`https://www.openstreetmap.org/?mlat=${activity.location.latitude}&mlon=${activity.location.longitude}#map=16/${activity.location.latitude}/${activity.location.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 border border-border-dark hover:border-gold/40 transition-all duration-base ease-elegant text-sm"
          >
            <span className="text-gold">●</span>
            <span className="text-text-primary dark:text-text-dark-primary font-light truncate">
              {activity.title}
            </span>
            <span className="text-text-secondary dark:text-text-dark-muted text-xs ml-auto whitespace-nowrap">
              {activity.location.address}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
};
