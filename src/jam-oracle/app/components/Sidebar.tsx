import type React from "react"
import { Button } from "@/app/components/ui/button"
import { Clock, MapPin, Car } from "lucide-react"

interface Route {
  id: number
  name: string
  duration: string
  distance: string
  traffic: string
}

interface SidebarProps {
  routes: Route[]
  selectedRoute: Route
  onRouteSelect: (route: Route) => void
}

const Sidebar: React.FC<SidebarProps> = ({ routes, selectedRoute, onRouteSelect }) => {
  return (
    <div className="w-80 bg-white shadow-md overflow-auto">
      <h2 className="text-xl font-bold p-4 border-b">Route Options</h2>
      {routes.map((route) => (
        <div
          key={route.id}
          className={`p-4 border-b transition-colors duration-200 ${
            selectedRoute.id === route.id ? "bg-blue-50" : "hover:bg-gray-50"
          }`}
        >
          <h3 className="font-semibold text-lg mb-2">{route.name}</h3>
          <div className="flex items-center text-gray-600 mb-1">
            <Clock className="w-4 h-4 mr-2" />
            <span>{route.duration}</span>
          </div>
          <div className="flex items-center text-gray-600 mb-1">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{route.distance}</span>
          </div>
          <div className="flex items-center text-gray-600 mb-3">
            <Car className="w-4 h-4 mr-2" />
            <span>Traffic: {route.traffic}</span>
          </div>
          <Button
            onClick={() => onRouteSelect(route)}
            variant={selectedRoute.id === route.id ? "secondary" : "outline"}
            className="w-full"
          >
            {selectedRoute.id === route.id ? "Selected" : "Select Route"}
          </Button>
        </div>
      ))}
    </div>
  )
}

export default Sidebar