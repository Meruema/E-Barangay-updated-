'use client';

import { motion } from 'framer-motion';

interface AnimatedLoaderProps {
  message?: string;
}

export default function AnimatedLoader({
  message = 'Loading...',
}: AnimatedLoaderProps) {
  return (
    <div className='flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100'>
      <div className='flex flex-col items-center space-y-6'>
        {/* Animated spinner */}
        <motion.div
          className='relative w-20 h-20'
          animate={{ rotate: 360 }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'linear',
          }}
        >
          <div className='absolute inset-0 border-4 border-blue-200 rounded-full'></div>
          <div className='absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full'></div>
        </motion.div>

        {/* Pulsing dots */}
        <div className='flex space-x-2'>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              className='w-3 h-3 bg-blue-600 rounded-full'
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: index * 0.2,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>

        {/* Loading message */}
        <motion.p
          className='text-gray-600 font-medium text-lg'
          animate={{
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {message}
        </motion.p>
      </div>
    </div>
  );
}
