import NodeCache from 'node-cache';

const cache = new NodeCache({ 
  stdTTL: 3600, // 1 hour default TTL
  checkperiod: 120 // Check for expired entries every 2 minutes
});

export const cacheMiddleware = (req: any, res: any, next: any) => {
  const key = req.originalUrl;
  const cachedResponse = cache.get(key);

  if (cachedResponse) {
    return res.send(cachedResponse);
  }

  res.sendResponse = res.send;
  res.send = (body: any) => {
    cache.set(key, body);
    res.sendResponse(body);
  };
  next();
};