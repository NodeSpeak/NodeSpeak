"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="icon"
        className="relative bg-transparent border-0 shadow-none hover:bg-transparent focus-visible:ring-0"
      >
        <div className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  // Use resolvedTheme to correctly handle "system" theme
  const isDark = resolvedTheme === "dark"

  // Show the OPPOSITE icon (what clicking will switch TO)
  // If currently dark, show Sun (click to go light)
  // If currently light, show Moon (click to go dark)
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative overflow-hidden transition-all duration-300 hover:scale-105 bg-transparent border-0 shadow-none hover:bg-transparent focus-visible:ring-0"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun icon: visible when in dark mode (click to switch to light) */}
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 rotate-90"
          }`}
        />
        {/* Moon icon: visible when in light mode (click to switch to dark) */}
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            isDark ? "opacity-0 scale-0 -rotate-90" : "opacity-100 scale-100 rotate-0"
          }`}
        />
      </div>
      <span className="sr-only">{isDark ? "Switch to light mode" : "Switch to dark mode"}</span>
    </Button>
  )
}