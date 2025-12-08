"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
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
        <Sun className="h-[1.2rem] w-[1.2rem]" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    )
  }

  const isDark = theme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="relative overflow-hidden transition-all duration-300 hover:scale-105 bg-transparent border-0 shadow-none hover:bg-transparent focus-visible:ring-0"
    >
      <div className="relative w-full h-full flex items-center justify-center">
        <Sun 
          className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            isDark ? "opacity-0 scale-0 rotate-90" : "opacity-100 scale-100 rotate-0"
          }`} 
        />
        <Moon 
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
            isDark ? "opacity-100 scale-100 rotate-0" : "opacity-0 scale-0 -rotate-90"
          }`} 
        />
      </div>
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}