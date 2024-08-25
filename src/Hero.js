import React from 'react';

const Hero = ({ x, y, color }) => {
    return (
        <div style={{ position: 'absolute', left: x, top: y, width: '50px', height: '50px', backgroundColor: color }} />
    );
};

export default Hero;
