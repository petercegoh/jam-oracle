import type React from "react"
import Image from "next/image"

interface Route {
  id: number
  name: string
  duration: string
  distance: string
  traffic: string
  path: string
  markers: { x: number; y: number }[]
}

interface MapProps {
  selectedRoute: Route
}

const Map: React.FC<MapProps> = ({ selectedRoute }) => {
  return (
    <div className="relative w-full h-full overflow-hidden">
      <Image
        src="/singapore-map.png"
        alt="Map of Central Singapore"
        layout="fill"
        objectFit="contain"
        className="select-none"
        priority
      />
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="routeGradient" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          <marker
            id="arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="4"
            markerHeight="4"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563eb" />
          </marker>
        </defs>

        <path
          d={selectedRoute.path}
          stroke="url(#routeGradient)"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          markerEnd="url(#arrow)"
          className="drop-shadow-sm"
        />

        {selectedRoute.markers.map((marker, index) => (
          <circle key={index} cx={marker.x} cy={marker.y} r="0.8" fill="#2563eb" className="animate-pulse" />
        ))}

        <g transform="translate(45,48)">
          <circle r="2" fill="#22c55e" />
          <circle r="3" fill="#22c55e" fillOpacity="0.3" />
          <circle r="4" fill="#22c55e" fillOpacity="0.1" className="animate-ping" />
        </g>

        <g transform="translate(60,35)">
          <circle r="2" fill="#ef4444" />
          <circle r="3" fill="#ef4444" fillOpacity="0.3" />
          <circle r="4" fill="#ef4444" fillOpacity="0.1" className="animate-ping" />
        </g>
      </svg>

      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm p-4 rounded-lg shadow-lg">
        <h3 className="font-semibold text-lg mb-1">{selectedRoute.name}</h3>
        <p className="text-gray-600">Duration: {selectedRoute.duration}</p>
        <p className="text-gray-600">Distance: {selectedRoute.distance}</p>
        <p className="text-gray-600">Traffic: {selectedRoute.traffic}</p>
      </div>
    </div>
  )
}

export default Map