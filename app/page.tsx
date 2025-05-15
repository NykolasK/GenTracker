"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function SplashScreen() {
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Simular tempo de carregamento e navegar para login
    const timer = setTimeout(() => {
      setLoading(false)
      router.push("/login")
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e1e]">
      <div className="flex flex-col items-center justify-center gap-16">
        {/* Logo */}
        <div className="relative w-40 h-40">
          <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Lock/Bag Shape */}
            <path
              d="M100 40C82.3 40 68 54.3 68 72V80H60C51.2 80 44 87.2 44 96V160C44 168.8 51.2 176 60 176H140C148.8 176 156 168.8 156 160V96C156 87.2 148.8 80 140 80H132V72C132 54.3 117.7 40 100 40Z"
              fill="#1e1e1e"
              stroke="white"
              strokeWidth="12"
            />
            {/* Blue Smile */}
            <path
              d="M70 120C70 120 85 140 100 140C115 140 130 120 130 120"
              stroke="#3B82F6"
              strokeWidth="10"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Loading Spinner */}
        <Loader2 className="w-8 h-8 text-white animate-spin" />
      </div>
    </div>
  )
}
