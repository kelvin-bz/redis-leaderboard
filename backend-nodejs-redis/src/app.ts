import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import Redis from 'ioredis';
import cors from 'cors';
import { startSimulation } from './simulation';
import { LeaderboardManager } from './LeaderboardManager';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const redis = new Redis();

const leaderboardManager = new LeaderboardManager(redis, wss);

app.use(cors());
app.use(express.json());

// Add a score for a player
app.post('/score', async (req, res) => {
  const { player, score } = req.body;
  
  if (typeof player !== 'string' || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    await leaderboardManager.addScore(player, score);
    res.json({ message: 'Score added successfully' });
  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top players
app.get('/leaderboard', async (req, res) => {
  const count = parseInt(req.query.count as string) || 100;

  try {
    const leaderboard = await leaderboardManager.getLeaderboard(count);
    res.json(leaderboard);
  } catch (error) {
    console.error('Error retrieving leaderboard:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startSimulation(leaderboardManager);
  console.log('Simulation started');
});

// Broadcast leaderboard every 2 seconds
setInterval(() => leaderboardManager.broadcastLeaderboard(), 2000);