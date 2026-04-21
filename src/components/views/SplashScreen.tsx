import { motion } from 'motion/react';
import { Heart } from 'lucide-react';

const SplashScreen = () => (
  <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
    <motion.div
      animate={{
        scale: [1, 1.2, 1],
      }}
      transition={{
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      className="text-red-500 mb-8"
    >
      <Heart size={120} fill="currentColor" />
    </motion.div>
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-2xl font-bold text-gray-800"
    >
      Made with love by Toman
    </motion.h1>
  </div>
);

export default SplashScreen;
