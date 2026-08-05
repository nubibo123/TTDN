interface UniversityMapProps {
  latitude: number
  longitude: number
  name: string
  address?: string
}

function buildEmbedUrl(lat: number, lng: number, name: string) {
  // OpenStreetMap iframe embed. Bbox controls the visible area; marker pins
  // the location. Max zoom = 17 keeps it tight. No API key, no CSP probe,
  // no Google permissions. Works anywhere.
  const delta = 0.01
  const bbox = `${lng - delta},${lat - delta},${lng + delta},${lat + delta}`
  const encodedName = encodeURIComponent(name)
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}&showMarker=1&q=${encodedName}`
}

function buildExternalUrl(lat: number, lng: number, name: string) {
  const encodedName = encodeURIComponent(name)
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=17/${lat}/${lng}&q=${encodedName}`
}

export default function UniversityMap({ latitude, longitude, name, address }: UniversityMapProps) {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-cream-50 p-8 text-center text-slate-500">
        Không có tọa độ bản đồ cho trường này
      </div>
    )
  }

  return (
    <div className="relative h-72 w-full overflow-hidden rounded-2xl border border-cream-200">
      <iframe
        title={`Bản đồ ${name}`}
        src={buildEmbedUrl(latitude, longitude, name)}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a
        href={buildExternalUrl(latitude, longitude, name)}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-2 right-2 rounded-md bg-white/90 px-2 py-1 text-[10px] font-medium text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white"
      >
        Xem bản đồ lớn ↗
      </a>
    </div>
  )
}
