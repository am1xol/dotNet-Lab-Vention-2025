import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Box } from '@mui/material';

interface AnimatedFormProps {
  children: React.ReactNode;
  key: string;
}

export const AnimatedForm: React.FC<AnimatedFormProps> = ({
  children,
  key,
}) => {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={key}
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
          duration: 0.3,
        }}
        style={{ width: '100%' }}
      >
        <Box sx={{ width: '100%' }}>{children}</Box>
      </motion.div>
    </AnimatePresence>
  );
};
