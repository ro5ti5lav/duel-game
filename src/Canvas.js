import React, { useRef, useEffect, useState } from 'react';

// Константы
const HERO_RADIUS = 20;
const PROJECTILE_RADIUS = 5;
const PROJECTILE_SPEED = 4;
const MOUSE_INTERACT_RADIUS = 100;

const Canvas = () => {
    const canvasRef = useRef(null);
    const [heroes, setHeroes] = useState([
        { x: 50, y: 100, vy: 2, shootInterval: 1000, color: 'red', projectileColor: 'black', projectiles: [], score: 0, lastShotTime: 0 },
        { x: 750, y: 100, vy: -2, shootInterval: 1000, color: 'blue', projectileColor: 'black', projectiles: [], score: 0, lastShotTime: 0 },
    ]);
    const [selectedHero, setSelectedHero] = useState(null);
    const [showColorPicker, setShowColorPicker] = useState(false);

    const handleMouseMove = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        setHeroes((prevHeroes) =>
            prevHeroes.map((hero) => {
                const dx = hero.x - mouseX;
                const dy = hero.y - mouseY;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < MOUSE_INTERACT_RADIUS) {
                    return {
                        ...hero,
                        vy: -hero.vy,
                    };
                }
                return hero;
            })
        );
    };

    const handleClick = (index) => {
        setSelectedHero(index);
        setShowColorPicker(true);
    };

    const handleColorChange = (color) => {
        setHeroes((prevHeroes) =>
            prevHeroes.map((hero, index) => {
                if (index === selectedHero) {
                    return { ...hero, projectileColor: color };
                }
                return hero;
            })
        );
        setShowColorPicker(false);
    };

    const shootProjectile = (x, y, vx, vy, color) => ({
        x,
        y,
        vx,
        vy,
        color,
    });

    useEffect(() => {
        const update = () => {
            setHeroes((prevHeroes) => {
                const canvas = canvasRef.current;
                const newHeroes = prevHeroes.map((hero) => {
                    let newHero = { ...hero };

                    // Move hero
                    newHero.y += newHero.vy;

                    // Bounce off top and bottom walls
                    if (newHero.y <= HERO_RADIUS || newHero.y >= canvas.height - HERO_RADIUS) {
                        newHero.vy = -newHero.vy;
                    }

                    // Move projectiles and remove those that are out of bounds
                    newHero.projectiles = newHero.projectiles
                        .map((proj) => ({
                            ...proj,
                            x: proj.x + proj.vx,
                            y: proj.y + proj.vy,
                        }))
                        .filter((proj) => proj.x >= 0 && proj.x <= canvas.width && proj.y >= 0 && proj.y <= canvas.height);

                    return newHero;
                });

                // Check collisions
                const [hero1, hero2] = newHeroes;

                hero1.projectiles.forEach((proj, projIndex) => {
                    const dx = proj.x - hero2.x;
                    const dy = proj.y - hero2.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < HERO_RADIUS + PROJECTILE_RADIUS) {
                        newHeroes[0].projectiles.splice(projIndex, 1); // Remove projectile
                        newHeroes[1].score += 1; // Increase other hero's score
                    }
                });

                hero2.projectiles.forEach((proj, projIndex) => {
                    const dx = proj.x - hero1.x;
                    const dy = proj.y - hero1.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance < HERO_RADIUS + PROJECTILE_RADIUS) {
                        newHeroes[1].projectiles.splice(projIndex, 1); // Remove projectile
                        newHeroes[0].score += 1; // Increase other hero's score
                    }
                });

                return newHeroes;
            });

            requestAnimationFrame(update);
        };

        update();
    }, []);

    useEffect(() => {
        const shootInterval = setInterval(() => {
            setHeroes((prevHeroes) => {
                const now = Date.now();

                return prevHeroes.map((hero, index) => {
                    const timeSinceLastShot = now - hero.lastShotTime;

                    if (timeSinceLastShot > hero.shootInterval) {
                        const xOffset = index === 0 ? HERO_RADIUS : -HERO_RADIUS;
                        return {
                            ...hero,
                            projectiles: [
                                ...hero.projectiles,
                                shootProjectile(
                                    hero.x + xOffset,
                                    hero.y,
                                    index === 0 ? PROJECTILE_SPEED : -PROJECTILE_SPEED,
                                    0,
                                    hero.projectileColor
                                ),
                            ],
                            lastShotTime: now,
                        };
                    }

                    return hero;
                });
            });
        }, 100);

        return () => clearInterval(shootInterval);
    }, []);

    const handleSliderChange = (heroIndex, field) => (e) => {
        const value = parseInt(e.target.value, 10);
        setHeroes(prevHeroes =>
            prevHeroes.map((hero, index) => {
                if (index === heroIndex) {
                    if (field === 'vy') {
                        return { ...hero, vy: value * (hero.vy > 0 ? 1 : -1) };
                    }
                    return { ...hero, [field]: value };
                }
                return hero;
            })
        );
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            heroes.forEach((hero) => {
                // Draw hero
                ctx.beginPath();
                ctx.arc(hero.x, hero.y, HERO_RADIUS, 0, 2 * Math.PI);
                ctx.fillStyle = hero.color;
                ctx.fill();
                ctx.closePath();

                // Draw projectiles
                hero.projectiles.forEach((proj) => {
                    ctx.beginPath();
                    ctx.arc(proj.x, proj.y, PROJECTILE_RADIUS, 0, 2 * Math.PI);
                    ctx.fillStyle = proj.color;
                    ctx.fill();
                    ctx.closePath();
                });
            });

            // Draw scores
            ctx.font = '24px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(`Счёт 1: ${heroes[0].score}`, 10, 30);
            ctx.fillText(`Счёт 2: ${heroes[1].score}`, canvas.width - 120, 30);

            requestAnimationFrame(render);
        };

        render();
    }, [heroes]);

    return (
        <div className="App">
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                onMouseMove={handleMouseMove}
                onClick={(e) => {
                    const canvas = canvasRef.current;
                    const rect = canvas.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;

                    const heroIndex = heroes.findIndex(
                        (hero) =>
                            Math.sqrt((hero.x - mouseX) ** 2 + (hero.y - mouseY) ** 2) <= HERO_RADIUS
                    );

                    if (heroIndex !== -1) {
                        handleClick(heroIndex);
                    }
                }}
            />
            <div className="controls">
                <div>
                    <h3>Красный</h3>
                    <label>
                        Скорость:
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={Math.abs(heroes[0].vy)}
                            onChange={handleSliderChange(0, 'vy')}
                        />
                        {Math.abs(heroes[0].vy)}
                    </label>
                    <br />
                    <label>
                        Интервал стрельбы (ms):
                        <input
                            type="range"
                            min="250"
                            max="5000"
                            value={heroes[0].shootInterval}
                            onChange={handleSliderChange(0, 'shootInterval')}
                        />
                        {heroes[0].shootInterval}
                    </label>
                </div>
                <div>
                    <h3>Синий</h3>
                    <label>
                        Скорость:
                        <input
                            type="range"
                            min="0"
                            max="10"
                            value={Math.abs(heroes[1].vy)}
                            onChange={handleSliderChange(1, 'vy')}
                        />
                        {Math.abs(heroes[1].vy)}
                    </label>
                    <br />
                    <label>
                        Интервал стрельбы (ms):
                        <input
                            type="range"
                            min="250"
                            max="5000"
                            value={heroes[1].shootInterval}
                            onChange={handleSliderChange(1, 'shootInterval')}
                        />
                        {heroes[1].shootInterval}
                    </label>
                </div>
            </div>
            {showColorPicker && (
                <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: 'white',
                    border: '1px solid black',
                    padding: '10px',
                    borderRadius: '5px'
                }}>
                    <h3>Выберите цвет пулек</h3>
                    <input
                        type="color"
                        onChange={(e) => handleColorChange(e.target.value)}
                        value={heroes[selectedHero]?.projectileColor}
                    />
                    <button onClick={() => setShowColorPicker(false)}>Close</button>
                </div>
            )}
        </div>
    );
};

export default Canvas;
