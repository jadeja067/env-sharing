import redis from 'redis'

const initRedisClient = async () => {
    console.log("Initializing Redis client");
    const client = redis.createClient({
        port: 6379,
        host: '127.0.0.1',
    });

    await client.connect();

    client.on('error', (err) => {
        console.error('Redis client error:', err);
    });

    return client;
};

const setVars = async (key, data) => {
    const redisClient = await initRedisClient();
    try {
        const res = await redisClient.set(key, JSON.stringify(data));
        if (res) console.log('Redis data is updated successfully');
        return res;
    } finally {
        await redisClient.quit();
    }
};

const getVars = async (key) => {
    const redisClient = await initRedisClient();
    try {
        const res = await redisClient.get(key);
        if (res) console.log('Redis data is retrived successfully');
        return JSON.parse(res);
    } finally {
        await redisClient.quit();
    }
};

export { initRedisClient, setVars, getVars };


