/* =============================================
   Animated Particle Constellation Background
   ============================================= */
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width, height;
    let particles = [];
    let mouse = { x: -9999, y: -9999 };
    let mouseTrail = []; // Added for the trail effect
    const MAX_TRAIL_LENGTH = 15;
    let animationId;

    const CONFIG = {
        particleCount: 80,
        maxSpeed: 0.35,
        particleRadius: 1.5,
        connectionDistance: 160,
        mouseRadius: 200,
        colors: [
            'rgba(168, 85, 247, ',   // purple
            'rgba(34, 211, 238, ',    // cyan
            'rgba(52, 211, 153, ',    // green
        ]
    };

    function resize() {
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
    }

    function createParticle() {
        const colorBase = CONFIG.colors[Math.floor(Math.random() * CONFIG.colors.length)];
        return {
            x: Math.random() * width,
            y: Math.random() * height,
            vx: (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
            vy: (Math.random() - 0.5) * CONFIG.maxSpeed * 2,
            radius: CONFIG.particleRadius * (0.5 + Math.random() * 0.8),
            colorBase: colorBase,
            alpha: 0.3 + Math.random() * 0.5,
            pulseSpeed: 0.002 + Math.random() * 0.003,
            pulsePhase: Math.random() * Math.PI * 2
        };
    }

    function initParticles() {
        particles = [];
        // Scale count with screen area
        const count = Math.min(CONFIG.particleCount, Math.floor((width * height) / 12000));
        for (let i = 0; i < count; i++) {
            particles.push(createParticle());
        }
    }

    function drawParticle(p, time) {
        const pulse = Math.sin(time * p.pulseSpeed + p.pulsePhase) * 0.2 + 0.8;
        const alpha = p.alpha * pulse;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.colorBase + alpha.toFixed(3) + ')';
        ctx.fill();
    }

    function drawConnections(time) {
        for (let i = 0; i < particles.length; i++) {
            for (let j = i + 1; j < particles.length; j++) {
                const dx = particles[i].x - particles[j].x;
                const dy = particles[i].y - particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < CONFIG.connectionDistance) {
                    const alpha = (1 - dist / CONFIG.connectionDistance) * 0.25; // Increased from 0.12
                    ctx.beginPath();
                    ctx.moveTo(particles[i].x, particles[i].y);
                    ctx.lineTo(particles[j].x, particles[j].y);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha.toFixed(3)})`;
                    ctx.lineWidth = 0.6; // Slightly thicker
                    ctx.stroke();
                }
            }
        }

        // Mouse connections
        for (let i = 0; i < particles.length; i++) {
            const dx = particles[i].x - mouse.x;
            const dy = particles[i].y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < CONFIG.mouseRadius) {
                const alpha = (1 - dist / CONFIG.mouseRadius) * 0.45; // Brighter
                ctx.beginPath();
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = 'rgba(168, 85, 247, ' + alpha.toFixed(3) + ')';
                ctx.lineWidth = 1.0; 
                ctx.stroke();
            }
        }
        
        // --- MOUSE TRAIL SMUDGE ---
        if (mouseTrail.length > 1) {
            ctx.beginPath();
            ctx.moveTo(mouseTrail[0].x, mouseTrail[0].y);
            for (let i = 1; i < mouseTrail.length; i++) {
                const p = mouseTrail[i];
                ctx.lineTo(p.x, p.y);
            }
            
            const gradient = ctx.createLinearGradient(
                mouseTrail[0].x, mouseTrail[0].y, 
                mouseTrail[mouseTrail.length-1].x, mouseTrail[mouseTrail.length-1].y
            );
            gradient.addColorStop(0, 'rgba(168, 85, 247, 0)');
            gradient.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
            
            ctx.strokeStyle = gradient;
            ctx.lineWidth = 12;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.shadowBlur = 15;
            ctx.shadowColor = 'rgba(168, 85, 247, 0.5)';
            ctx.stroke();
            
            // Reset shadow for other elements
            ctx.shadowBlur = 0;
        }
    }

    function update() {
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;

            // Bounce softly off edges
            if (p.x < 0 || p.x > width) p.vx *= -1;
            if (p.y < 0 || p.y > height) p.vy *= -1;

            // Subtle mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < CONFIG.mouseRadius && dist > 0) {
                const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * 0.05; // Increased force from 0.008
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }

            // Speed limit
            const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
            if (speed > CONFIG.maxSpeed) {
                p.vx = (p.vx / speed) * CONFIG.maxSpeed;
                p.vy = (p.vy / speed) * CONFIG.maxSpeed;
            }
        }
    }

    function animate(time) {
        ctx.clearRect(0, 0, width, height);
        update();
        
        // Decay mouse trail even when mouse not moving
        if (mouseTrail.length > 0) {
            // Slower decay for more visible "smuga"
            if (Math.random() > 0.4) {
                mouseTrail.shift();
            }
        }
        
        drawConnections(time);
        for (const p of particles) {
            drawParticle(p, time);
        }
        animationId = requestAnimationFrame(animate);
    }

    // ---- Events ----
    window.addEventListener('resize', () => {
        resize();
        initParticles();
    });

    window.addEventListener('mousemove', (e) => {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        
        // Add to trail
        mouseTrail.push({ x: e.clientX, y: e.clientY });
        if (mouseTrail.length > MAX_TRAIL_LENGTH) {
            mouseTrail.shift();
        }
        
        // Update CSS variables for spotlight effect
        document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
        document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    });

    window.addEventListener('mouseleave', () => {
        mouse.x = -9999;
        mouse.y = -9999;
        mouseTrail = []; // Clear trail
    });

    // Touch support
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            mouse.x = e.touches[0].clientX;
            mouse.y = e.touches[0].clientY;
        }
    }, { passive: true });

    window.addEventListener('touchend', () => {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    // ---- Init ----
    resize();
    initParticles();
    animate(0);
})();
