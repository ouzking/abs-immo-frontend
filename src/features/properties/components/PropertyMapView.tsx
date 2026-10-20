import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/**
 * Carte Leaflet + fonds OpenStreetMap (chargée à la demande, fichier JS séparé).
 * - position exacte : point ;
 * - position approximative (coordonnées arrondies à ~1 km par le backend) :
 *   cercle d'environ 1 km, jamais de point précis (contrat § 2.3).
 */
export default function PropertyMapView({
  latitude,
  longitude,
  exact,
  label,
}: {
  latitude: number
  longitude: number
  exact: boolean
  label: string
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const center: L.LatLngExpression = [latitude, longitude]
    const map = L.map(ref.current, { scrollWheelZoom: false, zoomControl: true }).setView(center, exact ? 16 : 14)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
    }).addTo(map)
    const style = { color: '#bf1522', weight: 2, fillColor: '#bf1522' }
    if (exact) L.circleMarker(center, { ...style, radius: 10, fillOpacity: 0.9 }).addTo(map)
    else L.circle(center, { ...style, radius: 1000, fillOpacity: 0.12 }).addTo(map)
    return () => {
      map.remove()
    }
  }, [latitude, longitude, exact])

  return <div ref={ref} role="region" aria-label={label} className="relative z-0 h-72 w-full rounded-card sm:h-80" />
}
