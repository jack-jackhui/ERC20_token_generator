import { motion } from 'framer-motion';

const AnimatedBackground = ({ image, duration = 100 }) => {
    return (
        <motion.div
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundRepeat: 'no-repeat',
            }}
            animate={{ x: ['-50%', '-100%', '-50%'] }}
            transition={{ duration: duration, repeat: Infinity, ease: "linear" }}
        />
    );
};

export default AnimatedBackground;
