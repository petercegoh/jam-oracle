"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Map from "./components/Map"
import Sidebar from "./components/Sidebar"
import { Input } from "@/app/components/ui/input"
import { Button } from "@/app/components/ui/button"
import { Search } from 'lucide-react'

interface Route {
  id: number
  name: string
  duration: string
  distance: string
  traffic: string
  path: string
  markers: { x: number; y: number }[]
}

export default function Home() {
  const [start, setStart] = useState("City Hall MRT")
  const [end, setEnd] = useState("Marina Bay")
  const [routes, setRoutes] = useState<Route[]>([])
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    setLoading(true)
    try {
      const data = [
        {
          id: 1,
          name: "Via Nicoll Highway",
          duration: "8 mins",
          distance: "2.3 km",
          traffic: "Light",
          path: "M45,48 L48,45 L52,42 L56,38 L60,35",
          markers: [
            { x: 48, y: 45 },
            { x: 52, y: 42 },
            { x: 56, y: 38 },
          ],
        },
        {
          id: 2,
          name: "Via Beach Road",
          duration: "10 mins",
          distance: "2.5 km",
          traffic: "Moderate",
          path: "M45,48 L47,47 L50,46 L54,43 L58,39 L60,35",
          markers: [
            { x: 50, y: 46 },
            { x: 54, y: 43 },
            { x: 58, y: 39 },
          ],
        },
        {
          id: 3,
          name: "Via Victoria Street",
          duration: "12 mins",
          distance: "2.8 km",
          traffic: "Heavy",
          path: "M45,48 L46,45 L48,43 L51,41 L55,38 L60,35",
          markers: [
            { x: 48, y: 43 },
            { x: 51, y: 41 },
            { x: 55, y: 38 },
          ],
        },
      ]

      setRoutes(data)
      setSelectedRoute(data[0])
    } catch (error) {
      console.error("Error fetching routes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    fetchRoutes()
  }

  const updateTrafficData = async () => {
    // This function will be implemented when integrating with Supabase
    // It will handle real-time traffic updates
  }

  useEffect(() => {
    const cleanup = updateTrafficData()
    return () => {
      if (cleanup) cleanup()
    }
  }, [])

  return (
    <main className="flex h-screen bg-gray-100">
      <Sidebar routes={routes} selectedRoute={selectedRoute} onRouteSelect={setSelectedRoute} />
      <div className="flex-1 flex flex-col">
        <div className="bg-white/90 backdrop-blur-sm shadow-md p-4 z-10">
          <div className="flex space-x-2 max-w-3xl mx-auto">
            <Input
              placeholder="Start location"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="flex-1"
            />
            <Input 
              placeholder="End location" 
              value={end} 
              onChange={(e) => setEnd(e.target.value)} 
              className="flex-1" 
            />
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700" disabled={loading}>
              <Search className="mr-2 h-4 w-4" /> {loading ? "Searching..." : "Search"}
            </Button>
          </div>
        </div>
        <div className="flex-1 relative">
          <Image
            src="/singapore-map.png"
            alt="Map of Singapore"
            layout="fill"
            objectFit="contain"
            className="select-none"
            priority
          />
          {selectedRoute && <Map selectedRoute={selectedRoute} />}
        </div>
      </div>
    </main>
  )
}