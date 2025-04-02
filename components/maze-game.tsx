"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { HelpCircle, ArrowLeft } from "lucide-react"

// Define maze cell types
type CellType = "wall" | "path" | "start" | "end" | "water"

// Define the maze structure
const initialMaze: CellType[][] = [
  ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
  ["wall", "path", "path", "path", "wall", "path", "path", "path", "path", "path", "end", "wall"],
  ["wall", "path", "wall", "path", "wall", "path", "wall", "wall", "wall", "wall", "path", "wall"],
  ["wall", "path", "wall", "path", "path", "path", "path", "path", "path", "wall", "path", "wall"],
  ["wall", "path", "wall", "wall", "wall", "wall", "wall", "wall", "path", "wall", "path", "wall"],
  ["wall", "path", "wall", "path", "path", "path", "path", "wall", "path", "path", "path", "wall"],
  ["wall", "path", "wall", "path", "wall", "wall", "path", "wall", "wall", "wall", "path", "wall"],
  ["wall", "path", "path", "path", "wall", "path", "path", "path", "path", "wall", "path", "wall"],
  ["wall", "wall", "wall", "wall", "wall", "path", "wall", "wall", "path", "wall", "path", "wall"],
  ["wall", "path", "path", "path", "path", "path", "wall", "path", "path", "wall", "path", "wall"],
  ["wall", "start", "wall", "wall", "wall", "wall", "wall", "water", "wall", "wall", "path", "wall"],
  ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"],
]

// Player position type
type Position = {
  x: number
  y: number
}

export default function MazeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playerPos, setPlayerPos] = useState<Position>({ x: 1, y: 10 }) // Start position
  const [gameWon, setGameWon] = useState(false)
  const [showPath, setShowPath] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [maze, setMaze] = useState(initialMaze)

  const cellSize = 40
  const hedgehogImage = useRef<HTMLImageElement | null>(null)
  const gazeboImage = useRef<HTMLImageElement | null>(null)

  // Load images
  useEffect(() => {
    hedgehogImage.current = new Image()
    hedgehogImage.current.src = "/hedgehog.svg"
    hedgehogImage.current.crossOrigin = "anonymous"

    gazeboImage.current = new Image()
    gazeboImage.current.src = "/gazebo.svg"
    gazeboImage.current.crossOrigin = "anonymous"
  }, [])

  // Find path from current position to goal
  const findPath = (): Position[] => {
    // If we're already at the end, return empty path
    if (maze[playerPos.y][playerPos.x] === "end") return []

    // Find end position
    let endPos: Position = { x: 0, y: 0 }
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        if (maze[y][x] === "end") {
          endPos = { x, y }
          break
        }
      }
    }

    // BFS to find shortest path
    const queue: { pos: Position; path: Position[] }[] = [{ pos: playerPos, path: [] }]
    const visited = new Set<string>()

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!
      const key = `${pos.x},${pos.y}`

      if (visited.has(key)) continue
      visited.add(key)

      // Check if we reached the end
      if (pos.x === endPos.x && pos.y === endPos.y) {
        return path
      }

      // Try all four directions
      const directions = [
        { x: 0, y: -1 }, // up
        { x: 1, y: 0 }, // right
        { x: 0, y: 1 }, // down
        { x: -1, y: 0 }, // left
      ]

      for (const dir of directions) {
        const newX = pos.x + dir.x
        const newY = pos.y + dir.y

        // Check if the new position is valid
        if (
          newY >= 0 &&
          newY < maze.length &&
          newX >= 0 &&
          newX < maze[0].length &&
          maze[newY][newX] !== "wall" &&
          !visited.has(`${newX},${newY}`)
        ) {
          queue.push({
            pos: { x: newX, y: newY },
            path: [...path, { x: newX, y: newY }],
          })
        }
      }
    }

    return [] // No path found
  }

  // Draw the maze
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    ctx.fillStyle = "#2d6a31"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw maze
    for (let y = 0; y < maze.length; y++) {
      for (let x = 0; x < maze[y].length; x++) {
        const cell = maze[y][x]

        if (cell === "wall") {
          // Draw hedge
          ctx.fillStyle = "#4caf50"
          ctx.beginPath()
          ctx.roundRect(x * cellSize, y * cellSize, cellSize, cellSize, 5)
          ctx.fill()

          // Add texture to hedge
          ctx.fillStyle = "#5dc264"
          ctx.beginPath()
          ctx.arc(x * cellSize + cellSize / 2, y * cellSize + cellSize / 2, cellSize / 4, 0, Math.PI * 2)
          ctx.fill()
        } else if (cell === "water") {
          // Draw water
          ctx.fillStyle = "#64b5f6"
          ctx.beginPath()
          ctx.ellipse(
            x * cellSize + cellSize / 2,
            y * cellSize + cellSize / 2,
            cellSize / 2,
            cellSize / 3,
            0,
            0,
            Math.PI * 2,
          )
          ctx.fill()
        } else if (cell === "end" && gazeboImage.current) {
          // Draw gazebo
          ctx.drawImage(
            gazeboImage.current,
            x * cellSize - cellSize / 4,
            y * cellSize - cellSize / 4,
            cellSize * 1.5,
            cellSize * 1.5,
          )
        }
      }
    }

    // Draw hint path if enabled
    if (showPath) {
      const path = findPath()
      ctx.fillStyle = "rgba(255, 215, 0, 0.5)" // Semi-transparent gold

      for (const pos of path) {
        ctx.beginPath()
        ctx.arc(pos.x * cellSize + cellSize / 2, pos.y * cellSize + cellSize / 2, cellSize / 4, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw player (hedgehog)
    if (hedgehogImage.current) {
      ctx.drawImage(hedgehogImage.current, playerPos.x * cellSize, playerPos.y * cellSize, cellSize, cellSize)
    }
  }, [maze, playerPos, showPath])

  // Handle keyboard movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameWon) return

      let newX = playerPos.x
      let newY = playerPos.y

      switch (e.key) {
        case "ArrowUp":
          newY--
          break
        case "ArrowDown":
          newY++
          break
        case "ArrowLeft":
          newX--
          break
        case "ArrowRight":
          newX++
          break
        default:
          return
      }

      // Check if the new position is valid
      if (newY >= 0 && newY < maze.length && newX >= 0 && newX < maze[0].length && maze[newY][newX] !== "wall") {
        setPlayerPos({ x: newX, y: newY })

        // Check if player reached the end
        if (maze[newY][newX] === "end") {
          setGameWon(true)
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [playerPos, maze, gameWon])

  // Reset game
  const resetGame = () => {
    setPlayerPos({ x: 1, y: 10 })
    setGameWon(false)
    setShowPath(false)
  }

  // Toggle path hint
  const togglePath = () => {
    setShowPath(!showPath)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={initialMaze[0].length * cellSize}
          height={initialMaze.length * cellSize}
          className="rounded-lg shadow-lg border-4 border-green-800"
        />

        {gameWon && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="bg-green-100 p-6 rounded-lg text-center">
              <h2 className="text-2xl font-bold text-green-800 mb-4">You Won!</h2>
              <p className="mb-4">The hedgehog made it to the gazebo!</p>
              <Button onClick={resetGame} className="bg-green-600 hover:bg-green-700">
                Play Again
              </Button>
            </div>
          </div>
        )}

        {showHelp && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
            <div className="bg-green-100 p-6 rounded-lg text-center max-w-xs">
              <h2 className="text-xl font-bold text-green-800 mb-2">How to Play</h2>
              <p className="mb-4">Help the hedgehog navigate through the maze to reach the gazebo!</p>
              <p className="mb-4">Use the arrow keys to move.</p>
              <p className="mb-4">Click the yellow button if you need a hint to show the path.</p>
              <Button onClick={() => setShowHelp(false)} className="bg-green-600 hover:bg-green-700">
                Got it!
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4 mt-4">
        <Button onClick={resetGame} size="icon" className="rounded-full w-12 h-12 bg-orange-500 hover:bg-orange-600">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <Button
          onClick={togglePath}
          size="icon"
          className={`rounded-full w-12 h-12 ${showPath ? "bg-yellow-600" : "bg-yellow-500 hover:bg-yellow-600"}`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6"
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        </Button>
        <Button
          onClick={() => setShowHelp(true)}
          size="icon"
          className="rounded-full w-12 h-12 bg-blue-500 hover:bg-blue-600"
        >
          <HelpCircle className="h-6 w-6" />
        </Button>
      </div>
    </div>
  )
}

