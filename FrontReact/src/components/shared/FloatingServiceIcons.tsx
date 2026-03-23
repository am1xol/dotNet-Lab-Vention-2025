import React, { memo, useMemo } from 'react';
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

const positions = [
  { x: '10%', y: '15%', rotation: -5 },
  { x: '24%', y: '33%', rotation: 3 },
  { x: '38%', y: '51%', rotation: -8 },
  { x: '52%', y: '69%', rotation: 6 },
  { x: '66%', y: '87%', rotation: -2 },
  { x: '80%', y: '22%', rotation: 7 },
  { x: '94%', y: '40%', rotation: -4 },
];

const backgroundCircles = [
  { size: 300, x: '10%', y: '10%', color: 'rgba(179, 157, 219, 0.15)' },
  { size: 200, x: '85%', y: '15%', color: 'rgba(206, 147, 216, 0.12)' },
  { size: 250, x: '15%', y: '70%', color: 'rgba(126, 87, 194, 0.15)' },
  { size: 180, x: '80%', y: '75%', color: 'rgba(179, 157, 219, 0.10)' },
];

const animationStyles = `
  @keyframes float {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-15px); }
  }
  @keyframes fadeInOut {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 0.8; }
  }
  .service-icon {
    animation: float 6s ease-in-out infinite;
    will-change: transform;
  }
  .bg-circle {
    animation: fadeInOut 8s ease-in-out infinite;
    will-change: opacity;
  }
`;

const FloatingServiceIcons: React.FC = () => {
  const serviceIcons = useMemo(() => services.map((service, index) => ({
    ...service,
    position: positions[index],
    delay: index * 0.5,
  })), []);

  return (
    <>
      <style>{animationStyles}</style>
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
        {backgroundCircles.map((circle, index) => (
          <Box
            key={`circle-${index}`}
            className="bg-circle"
            sx={{
              position: 'absolute',
              width: circle.size,
              height: circle.size,
              left: circle.x,
              top: circle.y,
              borderRadius: '50%',
              background: circle.color,
              filter: 'blur(25px)',
              animationDelay: `${index * 1.5}s`,
            }}
          />
        ))}

        {serviceIcons.map((service) => (
          <Box
            key={service.name}
            className="service-icon"
            sx={{
              position: 'absolute',
              width: service.size,
              height: service.size,
              left: service.position.x,
              top: service.position.y,
              opacity: 0.75,
              transform: `rotate(${service.position.rotation}deg)`,
              animationDelay: `${service.delay}s`,
              zIndex: 1,
              filter: 'drop-shadow(0 4px 12px rgba(126, 87, 194, 0.3))',
            }}
          >
            <img
              src={`/icons/${service.name.toLowerCase().replace(' ', '-')}.png`}
              alt={service.name}
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                borderRadius: '12px',
              }}
            />
          </Box>
        ))}
      </Box>
    </>
  );
};

export default memo(FloatingServiceIcons);
