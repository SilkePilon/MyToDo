"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabase-client"
import { EnvelopeClosedIcon, LockClosedIcon } from "@radix-ui/react-icons"

export function AuthForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      router.push("/projects")
    }
    setLoading(false)
  }

  const handleSignUp = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    } else {
      toast({
        title: "Success",
        description: "Check your email for the confirmation link!",
      })
    }
    setLoading(false)
  }

  return (
    <form onSubmit={handleSignIn} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <EnvelopeClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockClosedIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="pl-10"
          />
        </div>
      </div>
      <div className="flex flex-col space-y-2">
        <Button type="submit" disabled={loading} className="w-full transition-all duration-200 hover:scale-105">
          Sign In
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignUp}
          disabled={loading}
          className="w-full transition-all duration-200 hover:scale-105"
        >
          Sign Up
        </Button>
      </div>
    </form>
  )
}

