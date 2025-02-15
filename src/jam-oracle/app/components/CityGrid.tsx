"use client"

import type React from "react"

import { useEffect, useState } from "react"

type TrafficLevel = "low" | "medium" | "high"

interface GridCell {
  id: string
  trafficLevel: TrafficLevel
}

const trafficColors: Record<TrafficLevel, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-red-500",
}

const CityGrid: React.FC<{ size: number }> = ({ size }) => {
  const [grid, setGrid] = useState<GridCell[][]>([])

  useEffect(() => {
    generateGrid()
  }, []) // Removed unnecessary dependency: size

  const generateGrid = () => {
    const newGrid: GridCell[][] = []
    for (let i = 0; i < size; i++) {
      const row: GridCell[] = []
      for (let j = 0; j < size; j++) {
        row.push({
          id: `${i}-${j}`,
          trafficLevel: getRandomTrafficLevel(),
        })
      }
      newGrid.push(row)
    }
    setGrid(newGrid)
  }

  const getRandomTrafficLevel = (): TrafficLevel => {
    const rand = Math.random()
    if (rand < 0.6) return "low"
    if (rand < 0.9) return "medium"
    return "high"
  }

  return (
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
      {grid.map((row, i) =>
        row.map((cell) => (
          <div
            key={cell.id}
            className={`w-6 h-6 ${trafficColors[cell.trafficLevel]}`}
            title={`Traffic: ${cell.trafficLevel}`}
          />
        )),
      )}
    </div>
  )
}

export default CityGrid