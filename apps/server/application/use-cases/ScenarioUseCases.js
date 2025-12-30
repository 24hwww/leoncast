/**
 * Application Layer - Scenario Use Cases
 */

const fs = require('fs-extra')
const path = require('path')

class ScenarioUseCases {
    constructor(scenarioRepository, channelRepository, config) {
        this.scenarioRepository = scenarioRepository
        this.channelRepository = channelRepository
        this.config = config
    }

    async createScenario({ name, description, config, channelId }) {
        // Validate channel exists
        const channel = await this.channelRepository.findById(channelId)
        if (!channel) {
            throw new Error('Channel not found')
        }

        const scenario = await this.scenarioRepository.create({
            name,
            description,
            config: config || {},
            channelId
        })

        // Create file system structure
        await this._createScenarioFiles(scenario)

        return scenario
    }

    async getAllScenarios() {
        return await this.scenarioRepository.findAll()
    }

    async getScenarioById(id) {
        const scenario = await this.scenarioRepository.findById(id)
        if (!scenario) {
            throw new Error('Scenario not found')
        }
        return scenario
    }

    async getScenariosByChannel(channelId) {
        return await this.scenarioRepository.findByChannelId(channelId)
    }

    async deleteScenario(id) {
        const scenario = await this.getScenarioById(id)

        // Remove file system structure
        await this._deleteScenarioFiles(scenario.id)

        return await this.scenarioRepository.delete(id)
    }

    async activateScenario(id) {
        const scenario = await this.getScenarioById(id)

        // Deactivate all other scenarios in the same channel
        await this.scenarioRepository.deactivateAllByChannel(scenario.channelId)

        // Activate this scenario
        scenario.activate()
        return await this.scenarioRepository.update(id, { isActive: true })
    }

    async updateScenarioConfig(id, newConfig) {
        const scenario = await this.getScenarioById(id)
        scenario.updateConfig(newConfig)

        return await this.scenarioRepository.update(id, { config: scenario.config })
    }

    async _createScenarioFiles(scenario) {
        const scenarioDir = path.join(this.config.scenariosPath, scenario.id)
        await fs.ensureDir(scenarioDir)

        // Create default files
        const styleCss = `
body {
    margin: 0;
    padding: 0;
    overflow: hidden;
    background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
    color: white;
    font-family: 'Inter', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    width: 100vw;
}

canvas {
    display: none; /* Default to text if no canvas logic present */
}

.container {
    text-align: center;
}

h1 {
    font-size: 120px;
    font-weight: 800;
    letter-spacing: -0.05em;
    text-transform: uppercase;
    background: linear-gradient(to bottom right, #fff 50%, #94a3b8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    drop-shadow: 0 10px 20px rgba(0,0,0,0.5);
    margin: 0;
}

.badge {
    display: inline-block;
    padding: 8px 20px;
    background: #4f46e5;
    border-radius: 99px;
    font-size: 24px;
    font-weight: 600;
    margin-bottom: 20px;
    box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}`

        const indexHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scenario.name}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <div class="badge">LEONCAST LIVE</div>
        <h1>${scenario.name}</h1>
    </div>
    <script src="script.js"></script>
</body>
</html>`

        const scriptJs = `// Scenario: ${scenario.name}
console.log('Scenario "${scenario.name}" loaded and running.');

/**
 * WebSocket Connection for Real-time Interaction
 * Listens for events sent from the "Remote Action" page
 */
const connectWS = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(\`\${protocol}//\${window.location.host}/ws?scenarioId=${scenario.id}\`);

    ws.onopen = () => console.log('Connected to LeonCast Real-time System');
    
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            console.log('Action received:', data.type, data);
            
            // Simple visual feedback examples
            const h1 = document.querySelector('h1');
            const badge = document.querySelector('.badge');
            
            switch(data.type) {
                case 'EVENT_1':
                    document.body.style.background = 'linear-gradient(135deg, #1e40af 0%, #1e1b4b 100%)';
                    if (h1) h1.innerText = 'EFECTO ALPHA';
                    break;
                case 'EVENT_2':
                    document.body.style.background = 'linear-gradient(135deg, #7e22ce 0%, #1e1b4b 100%)';
                    if (h1) h1.innerText = 'EFECTO BETA';
                    break;
                case 'EVENT_3':
                    document.body.style.background = 'linear-gradient(135deg, #047857 0%, #1e1b4b 100%)';
                    if (h1) h1.innerText = 'SISTEMA OK';
                    break;
                case 'EVENT_4':
                    if (badge) {
                        badge.style.background = '#e11d48';
                        badge.innerText = 'ALERTA CRÍTICA';
                        setTimeout(() => {
                            badge.style.background = '#4f46e5';
                            badge.innerText = 'LEONCAST LIVE';
                        }, 3000);
                    }
                    break;
            }
        } catch (e) {
            console.error('Failed to process message:', e);
        }
    };
    
    ws.onclose = () => {
        console.log('Disconnected. Retrying in 3s...');
        setTimeout(connectWS, 3000);
    };
};

// Initialize connection
connectWS();`

        await Promise.all([
            fs.writeFile(path.join(scenarioDir, 'index.html'), indexHtml),
            fs.writeFile(path.join(scenarioDir, 'script.js'), scriptJs),
            fs.writeFile(path.join(scenarioDir, 'style.css'), styleCss)
        ])
    }

    async _deleteScenarioFiles(scenarioId) {
        const scenarioDir = path.join(this.config.scenariosPath, scenarioId)
        await fs.remove(scenarioDir)
    }
}

module.exports = ScenarioUseCases
