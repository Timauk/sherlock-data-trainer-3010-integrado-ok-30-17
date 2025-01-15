import express from 'express';
const router = express.Router();

router.get('/', (_, res) => {
  res.json({ 
    status: 'online',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpuUsage: process.cpuUsage()
  });
});

export { router as statusRouter };