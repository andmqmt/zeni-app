'use client';

import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

interface PreviewCountdownProps {
  secondsRemaining: number;
  isExpiring?: boolean;
}

export default function PreviewCountdown({ secondsRemaining }: PreviewCountdownProps) {
  const totalSeconds = 60;
  const progress = (secondsRemaining / totalSeconds) * 100;
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const displayTime = minutes > 0 ? `${minutes}:${seconds.toString().padStart(2, '0')}` : `${seconds}s`;

  const getColorClasses = () => {
    if (secondsRemaining <= 10) {
      return {
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-500/20 dark:bg-red-500/10',
        border: 'border-red-500/30 dark:border-red-500/20',
        icon: 'text-red-500 dark:text-red-400',
      };
    } else if (secondsRemaining <= 30) {
      return {
        text: 'text-orange-600 dark:text-orange-400',
        bg: 'bg-orange-500/20 dark:bg-orange-500/10',
        border: 'border-orange-500/30 dark:border-orange-500/20',
        icon: 'text-orange-500 dark:text-orange-400',
      };
    }
    return {
      text: 'text-yellow-600 dark:text-yellow-400',
      bg: 'bg-yellow-500/20 dark:bg-yellow-500/10',
      border: 'border-yellow-500/30 dark:border-yellow-500/20',
      icon: 'text-yellow-500 dark:text-yellow-400',
    };
  };

  const colors = getColorClasses();

  return (
    <motion.div
      className={`relative inline-flex items-center gap-1 md:gap-1.5 px-1.5 md:px-2 py-0.5 rounded-full ${colors.bg} ${colors.border} border transition-all`}
      animate={
        secondsRemaining <= 10
          ? {
              scale: [1, 1.02, 1],
              transition: {
                duration: 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }
          : {}
      }
      style={{ minWidth: 'fit-content' }}
    >
      <div className="absolute inset-0 rounded-full overflow-hidden opacity-10">
        <motion.div
          className={`h-full ${colors.text.replace('text-', 'bg-').replace('-600', '-500').replace('-400', '-500')}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.1, ease: 'linear' }}
        />
      </div>
      <motion.div
        className="relative z-10 flex-shrink-0"
        animate={
          secondsRemaining <= 10
            ? {
                rotate: [0, -5, 5, -5, 0],
                transition: {
                  duration: 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                },
              }
            : {}
        }
      >
        <Clock className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${colors.icon} ${secondsRemaining <= 10 ? 'animate-pulse' : ''}`} />
      </motion.div>
      <span className={`relative z-10 text-[10px] sm:text-xs font-semibold tabular-nums ${colors.text} whitespace-nowrap`}>
        {displayTime}
      </span>
      {secondsRemaining <= 10 && (
        <motion.span
          className={`relative z-10 text-[9px] sm:text-[10px] font-bold ${colors.text} flex-shrink-0`}
          initial={{ opacity: 0, x: -4 }}
          animate={{ opacity: [0, 1, 0], x: 0 }}
          transition={{ duration: 1, repeat: Infinity }}
        >
          !
        </motion.span>
      )}
    </motion.div>
  );
}
