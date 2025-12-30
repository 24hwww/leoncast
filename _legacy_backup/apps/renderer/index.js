const fastify = require('fastify')({ logger: true });
const puppeteer = require('puppeteer-core');
const path = require('path');

const CHROME_PATH = process.env.CHROME_PATH || '/usr/bin/chromium-browser';
const PORT = process.env.PORT || 5000;

let browser;
const activePages = new Map();

/**
 * Get or create a page for a scenario
 */
async function getPage(scenarioId) {
    if (activePages.has(scenarioId)) {
        return activePages.get(scenarioId);
    }

    if (!browser) {
        browser = await puppeteer.launch({
            executablePath: CHROME_PATH,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu'
            ]
        });
    }

    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });

    // The scenario is served by the backend at /s/:scenarioId/
    const baseUrl = process.env.BACKEND_URL || 'http://backend:3000';
    await page.goto(`${baseUrl}/s/${scenarioId}/`, { waitUntil: 'networkidle0' });

    activePages.set(scenarioId, page);
    return page;
}

// MJPEG Stream Endpoint
fastify.get('/render/:scenarioId', async (request, reply) => {
    const { scenarioId } = request.params;

    try {
        const page = await getPage(scenarioId);

        // MJPEG Headers
        reply.raw.writeHead(200, {
            'Content-Type': 'multipart/x-mixed-replace; boundary=--frame',
            'Cache-Control': 'no-cache',
            'Connection': 'close',
            'Pragma': 'no-cache'
        });

        const sendFrame = async () => {
            if (reply.raw.destroyed) return;

            try {
                const screenshot = await page.screenshot({
                    type: 'jpeg',
                    quality: 60, // Optimized quality for stream/preview
                    omitBackground: true
                });

                reply.raw.write(`--frame\r\nContent-Type: image/jpeg\r\nContent-Length: ${screenshot.length}\r\n\r\n`);
                reply.raw.write(screenshot);
                reply.raw.write('\r\n');

                // Limit to ~20 FPS to save CPU
                setTimeout(sendFrame, 50);
            } catch (err) {
                console.error('Screenshot error:', err);
                // Try to recover if page crashed
                activePages.delete(scenarioId);
            }
        };

        sendFrame();

        request.raw.on('close', () => {
            // Check if anyone else is watching? 
            // For now, we keep the page alive for some time to avoid re-loading lag
            setTimeout(() => {
                // If no requests for this scenario in 30s, we could close it.
                // Simplified for now.
            }, 30000);
        });

    } catch (err) {
        fastify.log.error(err);
        reply.code(500).send({ error: 'Failed to render scenario' });
    }
});

// Health check
fastify.get('/health', async () => ({ status: 'ok' }));

const start = async () => {
    try {
        await fastify.listen({ port: PORT, host: '0.0.0.0' });
        console.log(`Renderer listening on ${PORT}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
