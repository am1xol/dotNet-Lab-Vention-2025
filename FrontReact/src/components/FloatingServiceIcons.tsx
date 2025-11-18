import React from 'react';
import { motion } from 'framer-motion';
import { Box } from '@mui/material';

const services = [
  { name: 'Netflix', color: '#E50914', size: 110 },
  { name: 'YouTube', color: '#FF0000', size: 105 },
  { name: 'Spotify', color: '#1DB954', size: 100 },
  { name: 'Apple TV', color: '#000000', size: 108 },
  { name: 'Twitch', color: '#9146FF', size: 102 },
  { name: 'VK', color: '#0077FF', size: 106 },
  { name: 'Google', color: '#4285F4', size: 104 },
];

const generatePositions = (count: number) => {
  const positions = [];
  for (let i = 0; i < count; i++) {
    positions.push({
      x: `${10 + (i * 14) % 75}%`,
      y: `${15 + (i * 18) % 65}%`,
      rotation: -8 + Math.random() * 16,
    });
  }
  return positions;
};

const positions = generatePositions(services.length);

const backgroundCircles = [
  { size: 300, x: '10%', y: '10%', color: 'rgba(179, 157, 219, 0.08)' },
  { size: 200, x: '85%', y: '15%', color: 'rgba(206, 147, 216, 0.06)' },
  { size: 250, x: '15%', y: '70%', color: 'rgba(126, 87, 194, 0.07)' },
  { size: 180, x: '80%', y: '75%', color: 'rgba(179, 157, 219, 0.05)' },
  { size: 220, x: '5%', y: '40%', color: 'rgba(206, 147, 216, 0.06)' },
  { size: 280, x: '90%', y: '50%', color: 'rgba(126, 87, 194, 0.08)' },
];

const FloatingServiceIcons: React.FC = () => {
  return (
    <Box
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >

      {/* Фоновые кружки */}
      {backgroundCircles.map((circle, index) => (
        <Box
          key={`circle-${index}`}
          sx={{
            position: 'absolute',
            width: circle.size,
            height: circle.size,
            left: circle.x,
            top: circle.y,
            borderRadius: '50%',
            background: circle.color,
            filter: 'blur(40px)',
            opacity: 0.7,
          }}
        />
      ))}


      {/* Иконки сервисов */}
      {services.map((service, index) => {
        const position = positions[index];
        
        return (
          <motion.div
            key={service.name}
            style={{
              position: 'absolute',
              width: `${service.size}px`,
              height: `${service.size}px`,
              left: position.x,
              top: position.y,
              opacity: 0.75, 
              filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))',
              transform: `rotate(${position.rotation}deg)`,
              zIndex: 1, 
            }}
            initial={{
              y: 0,
              rotateZ: position.rotation,
            }}
            animate={{
              y: [
                0,
                -25,
                0,
                15,  
                0
              ],
              rotateZ: [
                position.rotation,
                position.rotation - 3,
                position.rotation + 2,
                position.rotation
              ],
              scale: [
                1,
                1.08,
                1,
                0.96, 
                1
              ],
            }}
            transition={{
              duration: 7 + index * 0.8,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: "easeInOut",
              times: [0, 0.3, 0.6, 0.8, 1],
            }}
          >
            {<img
              src={`/icons/${service.name.toLowerCase().replace(' ', '-')}.png`}
              alt={service.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'brightness(1.15) contrast(1.15) drop-shadow(0 8px 16px rgba(0,0,0,0.5))',
                borderRadius: '12px',
              }}
            /> }
          </motion.div>
        );
      })}

      <Box
        sx={{
          position: 'absolute',
          top: '30%',
          right: '8%',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(126, 87, 194, 0.1), rgba(179, 157, 219, 0.05))',
          filter: 'blur(15px)',
          opacity: 0.6,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: '25%',
          left: '5%',
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(206, 147, 216, 0.08), rgba(126, 87, 194, 0.12))',
          filter: 'blur(20px)',
          opacity: 0.5,
        }}
      />
    </Box>
  );
};

export default FloatingServiceIcons;