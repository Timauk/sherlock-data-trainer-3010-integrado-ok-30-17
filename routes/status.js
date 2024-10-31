import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpuUsage: process.cpuUsage()
  });
});

export { router as statusRouter };