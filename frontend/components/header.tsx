"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { MoonIcon, SunIcon } from "@radix-ui/react-icons"
import { useTheme } from "next-themes"
import { Card } from "@/components/ui/card"

const navigation = [
  { name: "Projects", href: "/projects" },
  { name: "Daily Planner", href: "/planner" },
]

export function Header() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()

  return (
    <header className="w-full bg-background sticky top-0 z-40 border-b">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="font-bold text-lg">
            MyToDo
          </Link>
          <Card className="bg-secondary/50 p-1 flex items-center space-x-4">
            <nav className="flex space-x-4">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-colors hover:bg-secondary ${
                    pathname === item.href ? "bg-secondary text-foreground" : "text-foreground/60"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle theme"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              <SunIcon className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <MoonIcon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </Card>
        </div>
      </div>
    </header>
  )
}

