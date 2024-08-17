import express from 'express';
import http from 'http';
import WebSocket from 'ws';
import Redis from 'ioredis';
import cors from 'cors';
import { startSimulation } from './simulation';

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const redis = new Redis();

app.use(cors());
app.use(express.json());

// Add a score for a player
app.post('/score', async (req, res) => {
  const { player, score } = req.body;
  
  if (typeof player !== 'string' || typeof score !== 'number') {
    return res.status(400).json({ error: 'Invalid input' });
  }

  try {
    await redis.zadd('leaderboard', score, player);
    res.json({ message: 'Score added successfully' });
    await broadcastLeaderboard();
  } catch (error) {
    console.error('Error adding score:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get top players
app.get('/leaderboard', async (req, res) => {
  const count = parseInt(req.query.count as string) || 100;

  try {
    const leaderboard = await redis.zrevrange('leaderboard', 0, count - 1, 'WITHSCORES');
    const formattedLeaderboard = formatLeaderboard(leaderboard);
    res.json(formattedLeaderboard);
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

// Function to broadcast leaderboard updates
async function broadcastLeaderboard() {
  const leaderboard = await redis.zrevrange('leaderboard', 0, 99, 'WITHSCORES');
  const formattedLeaderboard = formatLeaderboard(leaderboard);

  const message = JSON.stringify({
    type: 'leaderboard_update',
    leaderboard: formattedLeaderboard
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

function formatLeaderboard(leaderboard: string[]): Array<{player: string, score: number}> {
  const formattedLeaderboard = [];
  for (let i = 0; i < leaderboard.length; i += 2) {
    formattedLeaderboard.push({
      player: leaderboard[i],
      score: parseInt(leaderboard[i + 1])
    });
  }
  return formattedLeaderboard;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startSimulation();
  console.log('Simulation started');
});

// Broadcast leaderboard every 2 seconds
setInterval(broadcastLeaderboard, 2000);