"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, ArrowRight } from "lucide-react"
import Link from "next/link"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aqui você implementaria a lógica de autenticação
    // Por enquanto, vamos apenas simular um login bem-sucedido
    router.push("/dashboard")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#1e1e1e] p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="relative w-20 h-20">
            <svg width="100%" height="100%" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M100 40C82.3 40 68 54.3 68 72V80H60C51.2 80 44 87.2 44 96V160C44 168.8 51.2 176 60 176H140C148.8 176 156 168.8 156 160V96C156 87.2 148.8 80 140 80H132V72C132 54.3 117.7 40 100 40Z"
                fill="#1e1e1e"
                stroke="white"
                strokeWidth="12"
              />
              <path
                d="M70 120C70 120 85 140 100 140C115 140 130 120 130 120"
                stroke="#3B82F6"
                strokeWidth="10"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white text-center mb-8">Login</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium text-gray-300">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-gray-300">
              Senha
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <Link href="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
              Esqueceu a senha?
            </Link>
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
          >
            Entrar
            <ArrowRight size={18} />
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Não tem uma conta?{" "}
            <Link href="/register" className="text-blue-400 hover:text-blue-300 font-medium">
              Registre-se
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
