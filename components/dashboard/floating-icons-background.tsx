"use client"

import * as React from "react"

export function FloatingIconsBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Top left - slower, larger */}
      <div className="absolute animate-float-slow" style={{ top: '10%', left: '10%' }}>
        <span className="text-6xl opacity-15">🇮🇳</span>
      </div>

      {/* Top right - medium speed */}
      <div className="absolute animate-float-medium" style={{ top: '15%', right: '15%' }}>
        <span className="text-5xl opacity-10">🍛</span>
      </div>

      {/* Middle left - fast */}
      <div className="absolute animate-float-fast" style={{ top: '40%', left: '5%' }}>
        <span className="text-4xl opacity-12">🌶️</span>
      </div>

      {/* Middle right - slow */}
      <div className="absolute animate-float-slow" style={{ top: '45%', right: '8%' }}>
        <span className="text-5xl opacity-15">🫓</span>
      </div>

      {/* Lower middle left - medium */}
      <div className="absolute animate-float-medium" style={{ top: '65%', left: '12%' }}>
        <span className="text-4xl opacity-10">🥘</span>
      </div>

      {/* Lower right - fast */}
      <div className="absolute animate-float-fast" style={{ top: '70%', right: '20%' }}>
        <span className="text-6xl opacity-12">🍚</span>
      </div>

      {/* Bottom left - slow */}
      <div className="absolute animate-float-slow" style={{ top: '85%', left: '20%' }}>
        <span className="text-5xl opacity-15">🧄</span>
      </div>

      {/* Center top - medium */}
      <div className="absolute animate-float-medium" style={{ top: '25%', left: '50%' }}>
        <span className="text-4xl opacity-10">🥥</span>
      </div>

      {/* Center - fast, rotated animation */}
      <div className="absolute animate-float-rotate" style={{ top: '50%', right: '40%' }}>
        <span className="text-5xl opacity-12">🍛</span>
      </div>
    </div>
  )
}
