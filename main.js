/* Merged file for static file:// support */

/* --- RENDERER --- */
class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridSize = 20;

        // Background Image
        this.bgImage = new Image();
        this.bgImage.src = 'floorplan.jpg';
        // Trigger generic update when loaded (if within app context, but here we just rely on loop)
    }

    resize() {
        // Make canvas match its display size
        const parent = this.canvas.parentElement;
        this.canvas.width = parent.clientWidth;
        this.canvas.height = parent.clientHeight;
    }

    clear() {
        if (this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
            this.ctx.drawImage(this.bgImage, 0, 0, this.canvas.width, this.canvas.height);

            // Optional: Add slight dark overlay to make drawing pop
            this.ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        } else {
            this.ctx.fillStyle = '#1e293b'; // Fallback
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#334155';
        this.ctx.lineWidth = 0.5;
        this.ctx.beginPath();

        for (let x = 0; x <= this.canvas.width; x += this.gridSize) {
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
        }

        for (let y = 0; y <= this.canvas.height; y += this.gridSize) {
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
        }

        this.ctx.stroke();
    }

    drawWalls(walls) {
        this.ctx.lineCap = 'round';

        const wallColors = {
            'concrete': '#1a202c', // Dark Gray (Very dark)
            'drywall': '#ffffff',  // White
            'glass': '#38bdf8',    // Light Blue (Sky)
            'wood': '#8B4513'      // Real Wood Brown (SaddleBrown)
        };

        walls.forEach(wall => {
            this.ctx.beginPath();
            this.ctx.lineWidth = wall.type === 'concrete' ? 6 : 4; // Bold for concrete
            this.ctx.strokeStyle = wallColors[wall.type] || '#94a3b8';
            this.ctx.moveTo(wall.start.x, wall.start.y);
            this.ctx.lineTo(wall.end.x, wall.end.y);
            this.ctx.stroke();

            // Draw Length
            const distPx = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
            const distM = (distPx * 0.05).toFixed(2); // 20px = 1m
            const midX = (wall.start.x + wall.end.x) / 2;
            const midY = (wall.start.y + wall.end.y) / 2;

            this.ctx.fillStyle = '#cbd5e1'; // Text color
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(`${distM}m`, midX + 5, midY - 5);
        });
    }

    drawPreviewWall(wall) {
        if (!wall) return;
        this.ctx.strokeStyle = '#60a5fa'; // Preview color (blueish)
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(wall.start.x, wall.start.y);
        this.ctx.lineTo(wall.end.x, wall.end.y);
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw Length
        const distPx = Math.hypot(wall.end.x - wall.start.x, wall.end.y - wall.start.y);
        const distM = (distPx * 0.05).toFixed(2);
        const midX = (wall.start.x + wall.end.x) / 2;
        const midY = (wall.start.y + wall.end.y) / 2;

        this.ctx.fillStyle = '#60a5fa';
        this.ctx.font = '10px Arial';
        this.ctx.fillText(`${distM}m`, midX + 5, midY - 5);
    }

    drawRouter(router) {
        if (!router) return;

        // Draw Router Icon/Circle
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.beginPath();
        this.ctx.arc(router.x, router.y, 8, 0, Math.PI * 2);
        this.ctx.fill();

        // Pulse effect ring
        this.ctx.strokeStyle = '#2563eb';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(router.x, router.y, 12, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px Arial';
        this.ctx.fillText("AP", router.x - 7, router.y - 10);
    }

    drawExtenders(extenders) {
        if (!extenders) return;
        extenders.forEach(ext => {
            // Draw Extender Icon (Orange)
            this.ctx.fillStyle = '#f59e0b';
            this.ctx.beginPath();
            this.ctx.arc(ext.x, ext.y, 7, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.strokeStyle = '#d97706';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(ext.x, ext.y, 10, 0, Math.PI * 2);
            this.ctx.stroke();

            this.ctx.fillStyle = 'white';
            this.ctx.font = '10px Arial';
            this.ctx.fillText("EXT", ext.x - 9, ext.y - 10);
        });
    }

    drawHeatmap(heatmapData) {
        if (!heatmapData) return;

        const cellW = this.gridSize; // Match simulation grid
        const cellH = this.gridSize;

        heatmapData.forEach(cell => {
            const color = this.getSignalColor(cell.signal);
            this.ctx.fillStyle = color;
            this.ctx.fillRect(cell.x, cell.y, cellW, cellH);
        });
    }

    getSignalColor(signalDbm) {
        // Map dBm to color
        // Range: -90 (Weak/Bad) to -30 (Strong/Good)
        let normalized = (signalDbm + 90) / 60; // 0 to 1
        normalized = Math.max(0, Math.min(1, normalized));

        // Color map: Red (0) -> Green (120)
        // 0 (Bad) -> Red
        // 1 (Good) -> Green
        const hue = normalized * 120;
        return `hsla(${hue}, 100%, 50%, 0.4)`; // 0.4 opacity
    }
}

/* --- INPUT HANDLER --- */
class InputHandler {
    constructor(canvas, state) {
        this.canvas = canvas;
        this.state = state;
        this.isDragging = false;
        this.startPoint = null;
        this.currentPoint = null;

        this.setupListeners();
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }

    setupListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('mouseleave', () => this.cancelDrag());
    }

    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        this.isDragging = true;
        this.startPoint = pos;

        if (this.state.tool === 'router') {
            this.state.router = { x: pos.x, y: pos.y };
            this.state.needsUpdate = true;
            this.state.needsCalculation = true;
            this.isDragging = false;
        } else if (this.state.tool === 'delete') {
            this.deleteObjectAt(pos);
            this.state.needsUpdate = true;
            this.state.needsCalculation = true;
            this.isDragging = false;
        } else if (this.state.tool === 'extender') {
            if (this.state.extenders.length < 3) {
                this.state.extenders.push({ x: pos.x, y: pos.y });
                this.state.needsUpdate = true;
                this.state.needsCalculation = true;
            } else {
                alert("الحد الأقصى هو 3 مقويات فقط");
            }
            this.isDragging = false;
        }
    }

    handleMouseMove(e) {
        if (!this.isDragging) return;
        this.currentPoint = this.getMousePos(e);

        if (this.state.tool === 'wall') {
            this.state.previewWall = {
                start: this.startPoint,
                end: this.currentPoint
            };
            this.state.needsUpdate = true;
        }
    }

    handleMouseUp(e) {
        if (!this.isDragging) return;

        if (this.state.tool === 'wall' && this.state.previewWall) {
            // Get current wall type
            const type = document.getElementById('wall-type').value;
            this.state.previewWall.type = type;

            this.state.walls.push(this.state.previewWall);
            this.state.previewWall = null;
            this.state.needsUpdate = true;
            this.state.needsCalculation = true;
        }

        this.isDragging = false;
        this.startPoint = null;
        this.currentPoint = null;
    }

    cancelDrag() {
        if (this.isDragging) {
            this.isDragging = false;
            this.state.previewWall = null;
            this.state.needsUpdate = true;
        }
    }

    deleteObjectAt(pos) {
        const threshold = 20;

        // Remove router if clicked
        if (this.state.router) {
            const dx = this.state.router.x - pos.x;
            const dy = this.state.router.y - pos.y;
            if (dx * dx + dy * dy < 400) { // 20px radius
                this.state.router = null;
                return;
            }
        }

        // Remove walls
        this.state.walls = this.state.walls.filter(wall => {
            return !this.isPointNearLine(pos, wall.start, wall.end, threshold);
        });

        // Remove extenders
        this.state.extenders = this.state.extenders.filter(ext => {
            const dx = ext.x - pos.x;
            const dy = ext.y - pos.y;
            return (dx * dx + dy * dy >= 400);
        });
    }

    isPointNearLine(p, a, b, threshold) {
        // Distance from point p to line segment ab
        const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2;
        if (l2 == 0) return false;

        let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2;
        t = Math.max(0, Math.min(1, t));

        const distSq = (p.x - (a.x + t * (b.x - a.x))) ** 2 +
            (p.y - (a.y + t * (b.y - a.y))) ** 2;

        return distSq < threshold * threshold;
    }
}

/* --- SIMULATION --- */
class Simulation {
    constructor(gridSize = 20) {
        this.gridSize = gridSize;
        this.walls = [];
        this.router = null;
        this.extenders = [];
        this.width = 0;
        this.height = 0;
        this.txPower = 20; // dBm
        this.frequency = 2.4; // GHz
        this.wallAttenuation = 12; // dB per wall
    }

    updateConfig(width, height, walls, router, extenders, txPower, freq) {
        this.width = width;
        this.height = height;
        this.walls = walls;
        this.router = router;
        this.extenders = extenders || [];
        this.txPower = parseFloat(txPower);
        this.frequency = parseFloat(freq);
    }

    calculateCoverage() {
        if (!this.router) return [];

        const points = [];
        const freqFactor = 20 * Math.log10(this.frequency * 1000) - 27.55; // Simplified FSPL constant part

        for (let x = 0; x < this.width; x += this.gridSize) {
            for (let y = 0; y < this.height; y += this.gridSize) {
                const centerX = x + this.gridSize / 2;
                const centerY = y + this.gridSize / 2;

                const distPixels = Math.hypot(centerX - this.router.x, centerY - this.router.y);
                const distMeters = distPixels * 0.05; // Assume 1px = 5cm -> 20px = 1m

                // Path Loss Calculation for Router
                let maxSignal = -100;

                // 1. Router Signal
                let s1 = this.calculateSignalFromSource(this.router, centerX, centerY, freqFactor);
                if (s1 > maxSignal) maxSignal = s1;

                // 2. Extenders Signal
                this.extenders.forEach(ext => {
                    let sE = this.calculateSignalFromSource(ext, centerX, centerY, freqFactor);
                    if (sE > maxSignal) maxSignal = sE;
                });

                if (maxSignal < -90) maxSignal = -90;

                points.push({
                    x: x,
                    y: y,
                    signal: maxSignal
                });
            }
        }
        return points;
    }

    calculateSignalFromSource(source, targetX, targetY, freqFactor) {
        const distPixels = Math.hypot(targetX - source.x, targetY - source.y);
        const distMeters = distPixels * 0.05;

        // Path Loss
        let signal = this.txPower;
        if (distMeters > 0.1) {
            const pathLoss = 20 * Math.log10(distMeters) + freqFactor;
            signal -= pathLoss;
        }

        // Check Walls
        const attenuation = this.calculateWallLoss(
            { x: source.x, y: source.y },
            { x: targetX, y: targetY }
        );
        signal -= attenuation;

        return signal;
    }

    calculateWallLoss(p1, p2) {
        let totalLoss = 0;
        const losses = {
            'concrete': 12, // dB
            'drywall': 4,
            'glass': 3,
            'wood': 2
        };

        for (const wall of this.walls) {
            if (this.segmentsIntersect(p1, p2, wall.start, wall.end)) {
                totalLoss += (losses[wall.type] || 10);
            }
        }
        return totalLoss;
    }

    // Standard line segment intersection
    segmentsIntersect(a, b, c, d) {
        const det = (b.x - a.x) * (d.y - c.y) - (d.x - c.x) * (b.y - a.y);
        if (det === 0) return false;

        const lambda = ((d.y - c.y) * (d.x - a.x) + (c.x - d.x) * (d.y - a.y)) / det;
        const gamma = ((a.y - b.y) * (d.x - a.x) + (b.x - a.x) * (d.y - a.y)) / det;

        return (0 < lambda && lambda < 1) && (0 < gamma && gamma < 1);
    }
}

/* --- MAIN APP --- */
class App {
    constructor() {
        this.canvas = document.getElementById('sim-canvas');
        this.renderer = new Renderer(this.canvas);
        this.simulation = new Simulation(20);

        this.state = {
            tool: 'wall', // wall, router, delete
            walls: [], // {start: {x,y}, end: {x,y}, type: string}
            router: null, // {x, y}
            extenders: [], // [{x,y}]
            previewWall: null,
            heatmap: null,
            needsUpdate: true,
            needsCalculation: false
        };

        this.input = new InputHandler(this.canvas, this.state);

        this.initUI();
        this.resize();
        window.addEventListener('resize', () => this.resize());

        // Start loop
        requestAnimationFrame(() => this.loop());
    }

    initUI() {
        // Tools
        document.getElementById('btn-draw-wall').addEventListener('click', (e) => this.setTool('wall', e.target));
        document.getElementById('btn-place-router').addEventListener('click', (e) => this.setTool('router', e.target));
        document.getElementById('btn-place-extender').addEventListener('click', (e) => this.setTool('extender', e.target));
        document.getElementById('btn-delete').addEventListener('click', (e) => this.setTool('delete', e.target));

        document.getElementById('btn-clear-all').addEventListener('click', () => {
            this.state.walls = [];
            this.state.router = null;
            this.state.extenders = []; // Clear extenders
            this.state.heatmap = null;
            this.state.needsUpdate = true;
            this.state.needsCalculation = true;
        });

        // Settings
        const txInput = document.getElementById('tx-power');
        const txVal = document.getElementById('tx-power-val');
        txInput.addEventListener('input', (e) => {
            txVal.textContent = e.target.value + ' dBm';
            this.state.needsCalculation = true;
        });

        document.getElementById('frequency').addEventListener('change', () => {
            this.state.needsCalculation = true;
        });
    }

    setTool(tool, btnElement) {
        this.state.tool = tool;

        // Update UI
        document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
        // Handle click on icon or button
        const btn = btnElement.closest('.tool-btn');
        if (btn) btn.classList.add('active');

        // Status text
        const status = document.getElementById('status-text');
        switch (tool) {
            case 'wall': status.textContent = "اضغط واسحب لرسم جدار"; break;
            case 'router': status.textContent = "اضغط لوضع الراوتر"; break;
            case 'extender': status.textContent = "اضغط لوضع مقوي (الحد 3)"; break;
            case 'delete': status.textContent = "اضغط على عنصر لحذفه"; break;
        }
    }

    resize() {
        this.renderer.resize();
        this.state.needsUpdate = true;
        this.state.needsCalculation = true;
    }

    loop() {
        if (this.state.needsCalculation || (this.state.router && this.state.needsUpdate)) {
            // Signal Calculation
            const txPower = document.getElementById('tx-power').value;
            const freq = document.getElementById('frequency').value;

            this.simulation.updateConfig(
                this.canvas.width,
                this.canvas.height,
                this.state.walls,
                this.state.router,
                this.state.extenders,
                txPower,
                freq
            );

            if (this.state.router) {
                this.state.heatmap = this.simulation.calculateCoverage();
            } else {
                this.state.heatmap = null;
            }

            this.state.needsCalculation = false;
            this.state.needsUpdate = true;
        }

        if (this.state.needsUpdate) {
            this.renderer.clear();

            // Draw Heatmap first (bottom layer)
            if (this.state.heatmap) {
                this.renderer.drawHeatmap(this.state.heatmap);
            }

            // Draw Grid
            this.renderer.drawGrid();

            // Draw Walls
            this.renderer.drawWalls(this.state.walls);
            // Draw Preview Wall
            this.renderer.drawPreviewWall(this.state.previewWall);

            // Draw Router & Extenders
            this.renderer.drawRouter(this.state.router);
            this.renderer.drawExtenders(this.state.extenders);

            this.state.needsUpdate = false;
        }

        requestAnimationFrame(() => this.loop());
    }
}

// Start App
new App();
