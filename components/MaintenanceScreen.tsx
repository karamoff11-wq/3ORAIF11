'use client'

import { motion } from 'framer-motion'

interface MaintenanceScreenProps {
  message: string
}

export default function MaintenanceScreen({ message }: MaintenanceScreenProps) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#04040f] overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-600/30 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 text-center px-6 max-w-lg space-y-8">
        {/* Animated Icon */}
        <motion.div
          animate={{ 
            rotate: [0, 10, -10, 0],
            scale: [1, 1.1, 1]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="text-8xl"
        >
          🛠️
        </motion.div>

        <div className="space-y-4">
          <h1 className="text-4xl font-black text-white tracking-tight">أبو العُريف تحت الصيانة</h1>
          <p className="text-lg text-white/60 leading-relaxed font-medium">
            {message}
          </p>
        </div>

        {/* Progress Bar Mockup */}
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500"
          />
        </div>

        <p className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-black">
          Abu Al-Areef · Technical Operations
        </p>
      </div>
    </div>
  )
}
