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

    drawDevices(devices, simulation) {
        if (!devices) return;
        devices.forEach(dev => {
            // Draw Device (Mobile Phone Style)
            this.ctx.fillStyle = '#8b5cf6';
            this.ctx.fillRect(dev.x - 6, dev.y - 10, 12, 20);
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(dev.x - 6, dev.y - 10, 12, 20);

            // Signal Info
            if (simulation && (simulation.router || simulation.extenders.length > 0)) {
                // Calculate signal at this point on the fly or pass it
                // For simplicity, we assume simulation object has helper
                const sig = simulation.calculateSignalAtPoint(dev.x, dev.y);
                const quality = sig > -60 ? "Excellent 🚀" : (sig > -75 ? "Good 👌" : (sig > -85 ? "Weak ⚠️" : "Dead 💀"));

                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.strokeStyle = 'black';
                this.ctx.lineWidth = 3;
                this.ctx.strokeText(`${Math.round(sig)}dBm`, dev.x + 10, dev.y);
                this.ctx.fillText(`${Math.round(sig)}dBm`, dev.x + 10, dev.y);

                this.ctx.font = '10px Arial';
                this.ctx.strokeText(quality, dev.x + 10, dev.y + 12);
                this.ctx.fillText(quality, dev.x + 10, dev.y + 12);
            }
        });
    }

    drawLabels(labels) {
        if (!labels) return;
        this.ctx.font = 'bold 14px Cairo, Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        labels.forEach(lbl => {
            const textWidth = this.ctx.measureText(lbl.text).width;

            // Background Pill
            this.ctx.fillStyle = 'rgba(30, 41, 59, 0.8)';
            this.ctx.beginPath();
            this.ctx.roundRect(lbl.x - textWidth / 2 - 8, lbl.y - 12, textWidth + 16, 24, 12);
            this.ctx.fill();
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Text
            this.ctx.fillStyle = '#f8fafc';
            this.ctx.fillText(lbl.text, lbl.x, lbl.y);
        });
    }

    drawSignalRays(devices, simulation) {
        if (!devices || !simulation) return;
        // Only if we have a source
        const sources = [];
        if (simulation.router) sources.push(simulation.router);
        simulation.extenders.forEach(e => sources.push(e));

        if (sources.length === 0) return;

        devices.forEach(dev => {
            // Find strongest source
            let bestSource = null;
            let bestSignal = -Infinity;
            const freqFactor = 20 * Math.log10(simulation.frequency * 1000) - 27.55;

            sources.forEach(src => {
                const s = simulation.calculateSignalFromSource(src, dev.x, dev.y, freqFactor);
                if (s > bestSignal) {
                    bestSignal = s;
                    bestSource = src;
                }
            });

            if (bestSource) {
                // Trace Path
                // Draw Direct Line from Source to Device
                // We will just draw a simple line for now, 
                // OR do advanced segment coloring (Green -> Red) based on intersections
                // Let's do a simple gradient line or dashed line

                const grad = this.ctx.createLinearGradient(bestSource.x, bestSource.y, dev.x, dev.y);
                grad.addColorStop(0, 'rgba(0, 255, 0, 0.5)'); // Source (Green)
                grad.addColorStop(1, 'rgba(255, 0, 0, 0.5)'); // Device (Red-ish)

                this.ctx.strokeStyle = grad;
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.moveTo(bestSource.x, bestSource.y);
                this.ctx.lineTo(dev.x, dev.y);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
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
        } else if (this.state.tool === 'device') {
            this.state.devices.push({ x: pos.x, y: pos.y });
            this.state.needsUpdate = true;
            this.isDragging = false;
        } else if (this.state.tool === 'label') {
            const text = prompt("أدخل اسم الغرفة/المنطقة:", "غرفة المعيشة");
            if (text) {
                this.state.labels.push({ x: pos.x, y: pos.y, text: text });
                this.state.needsUpdate = true;
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
        } else if (this.state.tool === 'calibrate_drawing') {
            // Preview calibration line
            this.state.previewLine = {
                start: this.state.calibrationPoints[0],
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
        } else if (this.state.tool === 'calibrate_drawing') {
            this.handleCalibrationEnd(this.currentPoint);
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

        // Remove devices
        this.state.devices = this.state.devices.filter(dev => {
            const dx = dev.x - pos.x;
            const dy = dev.y - pos.y;
            return (dx * dx + dy * dy >= 400);
        });

        // Remove labels
        this.state.labels = this.state.labels.filter(lbl => {
            const dx = lbl.x - pos.x;
            const dy = lbl.y - pos.y;
            // Approximate hit box
            return (Math.abs(dx) > 30 || Math.abs(dy) > 15);
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

    handleCalibrationEnd(pos) {
        if (this.state.tool !== 'calibrate_drawing') return;

        const start = this.state.calibrationPoints[0];
        const end = pos;

        // Calculate pixels
        const distPx = Math.hypot(end.x - start.x, end.y - start.y);

        if (distPx < 10) {
            alert("المسافة قصيرة جداً!");
            this.state.tool = 'calibrate';
            this.state.previewLine = null;
            this.state.needsUpdate = true;
            return;
        }

        // Prompt user
        setTimeout(() => {
            const meters = prompt("كم طول هذا الخط بالأمتار الحقيقية؟", "5");
            if (meters && !isNaN(meters) && meters > 0) {
                const newScale = distPx / parseFloat(meters); // Pixels per meter
                if (confirm(`هل تريد اعتماد المقياس الجديد: 1 متر = ${Math.round(newScale)} بكسل؟`)) {
                    this.state.scale = newScale;
                    document.getElementById('scale-display').textContent = `المقياس الحالي: 1m = ${Math.round(newScale)}px`;
                    this.state.needsCalculation = true; // Recalc physics
                }
            }
            // Reset
            this.state.tool = 'wall'; // Back to default
            this.state.previewLine = null;
            this.state.calibrationPoints = [];

            // Update UI buttons
            document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
            document.getElementById('btn-draw-wall').classList.add('active'); // Back to wall

            this.state.needsUpdate = true;
        }, 10);
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
        this.interference = 0; // dB
        this.frequency = 2.4; // GHz
        this.interference = 0; // dB
        this.wallAttenuation = 12; // dB per wall
        this.pixelsPerMeter = 20; // Default Scale
    }

    updateConfig(width, height, walls, router, extenders, txPower, freq, interference) {
        this.width = width;
        this.height = height;
        this.walls = walls;
        this.router = router;
        this.extenders = extenders || [];
        this.txPower = parseFloat(txPower);
        this.frequency = parseFloat(freq);
        this.frequency = parseFloat(freq);
        this.interference = parseFloat(interference) || 0;
    }

    setScale(pxPerMeter) {
        this.pixelsPerMeter = pxPerMeter;
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
                const distMeters = distPixels / this.pixelsPerMeter; // Dynamic Scale

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

                // Apply Interference
                maxSignal -= this.interference;

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

    calculateSignalAtPoint(x, y) {
        if (!this.router) return -100;
        const freqFactor = 20 * Math.log10(this.frequency * 1000) - 27.55;

        let maxSignal = this.calculateSignalFromSource(this.router, x, y, freqFactor);

        this.extenders.forEach(ext => {
            let s = this.calculateSignalFromSource(ext, x, y, freqFactor);
            if (s > maxSignal) maxSignal = s;
        });

        maxSignal -= this.interference;
        return maxSignal;
    }

    findBestPosition() {
        if (!this.width || !this.height) return null;
        // Brute force simplified: Scan grid points every 40px (2x grid size)
        // Find point with Max Average Signal
        const step = this.gridSize * 2;
        let bestScore = -Infinity;
        let bestPos = null;

        // Valid area check: simple internal points
        // We will just test points
        const freqFactor = 20 * Math.log10(this.frequency * 1000) - 27.55;

        for (let x = 20; x < this.width - 20; x += step) {
            for (let y = 20; y < this.height - 20; y += step) {
                // Check if inside wall? (Advanced, skip for now, assumed open plan mostly)
                // Score = Sum of signal at sample points
                // We'll sample 5 points to be fast: TopLeft, TopRight, BotLeft, BotRight, Center

                // Actually, metric should be "Coverage Area > -75dBm"
                // Let's do a quick local simulation for this candidate position
                // This is heavy. Alternatively, maximize distance from all walls? No.

                // Let's maximize "Minimum Distance to any wall" + "Centrality"?
                // No, use coverage.

                let routerCandidate = { x, y };
                let goodPixels = 0;

                // Sparse sampling for evaluation
                for (let sx = 0; sx < this.width; sx += step * 2) {
                    for (let sy = 0; sy < this.height; sy += step * 2) {
                        let sig = this.calculateSignalFromSource(routerCandidate, sx, sy, freqFactor);
                        if (sig > -75) goodPixels++;
                    }
                }

                if (goodPixels > bestScore) {
                    bestScore = goodPixels;
                    bestPos = { x, y };
                }
            }
        }
        return bestPos;
    }

    calculateSignalFromSource(source, targetX, targetY, freqFactor) {
        const distPixels = Math.hypot(targetX - source.x, targetY - source.y);
        const distMeters = distPixels / this.pixelsPerMeter;

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
            devices: [], // [{x,y}]
            labels: [], // [{x,y,text}]
            previewWall: null,
            heatmap: null,
            needsUpdate: true,
            needsUpdate: true,
            needsCalculation: false,
            scale: 20, // 20px = 1m
            previewLine: null, // For calibration
            calibrationPoints: []
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
        document.getElementById('btn-place-device').addEventListener('click', (e) => this.setTool('device', e.target));
        document.getElementById('btn-place-label').addEventListener('click', (e) => this.setTool('label', e.target));
        document.getElementById('btn-delete').addEventListener('click', (e) => this.setTool('delete', e.target));
        document.getElementById('btn-calibrate').addEventListener('click', (e) => this.setTool('calibrate', e.target));

        document.getElementById('btn-clear-all').addEventListener('click', () => {
            this.state.walls = [];
            this.state.router = null;
            this.state.extenders = [];
            this.state.devices = [];
            this.state.labels = [];
            this.state.heatmap = null;
            this.state.needsUpdate = true;
            this.state.needsCalculation = true;
        });

        // 🧠 Auto Optimize
        document.getElementById('btn-auto-optimize').addEventListener('click', () => {
            if (!this.state.heatmap) {
                // Force a calc if needed, but better to just use simulation
            }
            const status = document.getElementById('status-text');
            status.textContent = "جاري البحث عن أفضل مكان... ⏳";

            // Timeout to let UI render text
            setTimeout(() => {
                const best = this.simulation.findBestPosition();
                if (best) {
                    this.state.router = best;
                    this.state.needsCalculation = true;
                    this.state.needsUpdate = true;
                    status.textContent = "تم العثور على المكان المثالي! 🎯";
                } else {
                    status.textContent = "لم يتم العثور على مكان مناسب";
                }
            }, 100);
        });

        // 📷 Export
        document.getElementById('btn-export').addEventListener('click', () => {
            const link = document.createElement('a');
            link.download = 'wifi-coverage-plan.png';
            link.href = this.canvas.toDataURL('image/png');
            link.click();
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
        const btn = btnElement ? btnElement.closest('.tool-btn') : null;
        if (btn) btn.classList.add('active');

        // Status text
        const status = document.getElementById('status-text');
        switch (tool) {
            case 'wall': status.textContent = "اضغط واسحب لرسم جدار"; break;
            case 'router': status.textContent = "اضغط لوضع الراوتر"; break;
            case 'extender': status.textContent = "اضغط لوضع مقوي (الحد 3)"; break;
            case 'device': status.textContent = "اضغط لوضع جهاز ومعرفة جودة الإشارة"; break;
            case 'delete': status.textContent = "اضغط على عنصر لحذفه"; break;
            case 'calibrate': status.textContent = "اضغط نقطة البداية للمقياس"; break;
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
            const interference = document.getElementById('interference').value;

            this.simulation.updateConfig(
                this.canvas.width,
                this.canvas.height,
                this.state.walls,
                this.state.router,
                this.state.extenders,
                txPower,
                freq,
                interference
            );
            // Sync scale
            this.simulation.setScale(this.state.scale);

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

            // Draw Router & Extenders & Devices
            this.renderer.drawRouter(this.state.router);
            this.renderer.drawExtenders(this.state.extenders);
            this.renderer.drawDevices(this.state.devices, this.simulation);
            this.renderer.drawLabels(this.state.labels);
            this.renderer.drawSignalRays(this.state.devices, this.simulation);

            // Draw Preview Line (Calibration)
            if (this.state.previewLine) {
                this.renderer.drawPreviewWall(this.state.previewLine); // Reuse wall drawer for line
            }

            this.state.needsUpdate = false;
        }

        requestAnimationFrame(() => this.loop());
    }
}

// Start App
new App();
