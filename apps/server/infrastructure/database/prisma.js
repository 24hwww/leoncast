const { PrismaClient } = require('@prisma/client')
const { pub } = require('../cache/redis')

const prismaClient = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty'
})

// LeonCast "Pulse": Real-time Database Extension
const prisma = prismaClient.$extends({
    query: {
        $allModels: {
            async $allOperations({ model, operation, args, query }) {
                const result = await query(args);

                // Publish changes to Redis for real-time UI updates
                if (['create', 'update', 'delete', 'upsert', 'updateMany', 'deleteMany'].includes(operation)) {
                    const payload = {
                        type: 'DATABASE_CHANGE',
                        model,
                        operation,
                        timestamp: new Date().toISOString()
                    };

                    // Priority: Provided channelId > Related channelId > Own ID
                    const channelId = result?.channelId || args.data?.channelId || args.where?.channelId || result?.id || args.where?.id;

                    if (channelId) {
                        pub.publish(`channel:${channelId}`, JSON.stringify(payload));
                    }

                    // General bus for list updates (e.g., when a new channel is created)
                    pub.publish('channel:all', JSON.stringify(payload));
                }

                return result;
            },
        },
    },
})

// Graceful shutdown
process.on('beforeExit', async () => {
    await prismaClient.$disconnect()
})

module.exports = prisma
