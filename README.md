
# Real-Time Leaderboard Application

![leaderboard.png](img%2Fleaderboard.png)


This project implements a real-time leaderboard system using Node.js with Redis for the backend and React for the frontend. The application allows for dynamic updating of player scores and real-time display of the leaderboard using WebSocket communication.


## Prerequisites
- Node.js
- Redis server
- npm or yarn

## Setup and Installation

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend-nodejs-redis
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the backend directory and add your Redis configuration:
   ```
   REDIS_URL=redis://localhost:6379
   ```

4. Start the backend server:
   ```
   npm start
   ```

The backend server will start on `http://localhost:3000` by default.

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd frontend-reactjs
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the frontend directory and add your backend WebSocket URL:
   ```
   PORT=3001
   REACT_APP_BACKEND_URL=ws://localhost:3000
   ```

4. Start the frontend development server:
   ```
   npm start
   ```

The React application will start and be available at `http://localhost:3001` by default.

## Usage

Once both the backend and frontend are running:

1. The backend will automatically start a simulation that updates random player scores every 2 seconds.
2. Open the frontend application in your web browser to see the real-time leaderboard.
3. The leaderboard will update automatically as player scores change.
4. Position changes are visually indicated, and score changes are highlighted.


## Backend 


### LeaderboardManager

The `LeaderboardManager` class is a core component of the backend, responsible for managing the leaderboard data and WebSocket communications. It uses Redis for data storage and WebSocket for real-time updates.

#### Class Structure

```typescript
import Redis from 'ioredis';
import WebSocket from 'ws';

export class LeaderboardManager {
  private static readonly LEADERBOARD_KEY = 'leaderboard';
  private static readonly DEFAULT_LEADERBOARD_SIZE = 100;
  private static readonly INITIAL_SCORE = 1000;

  private readonly redis: Redis;
  private readonly wss: WebSocket.Server;

  constructor(redisClient: Redis, webSocketServer: WebSocket.Server) {
    this.redis = redisClient;
    this.wss = webSocketServer;
  }

  // ... methods ...
}
```

#### Key Methods

1. **addScore**
   ```typescript
   async addScore(player: string, score: number): Promise<void>
   ```
   Adds or updates a player's score in the leaderboard.
   - Uses `redis.zadd` to add or update the score in the 'leaderboard' sorted set.
   - Calls `broadcastLeaderboard` to update all connected clients.

2. **getLeaderboard**
   ```typescript
   async getLeaderboard(count: number = LeaderboardManager.DEFAULT_LEADERBOARD_SIZE): Promise<LeaderboardEntry[]>
   ```
   Retrieves the top players from the leaderboard.
   - Uses `redis.zrevrange` to get the top players with their scores.
   - Calls `formatLeaderboard` to structure the data.

3. **broadcastLeaderboard**
   ```typescript
   async broadcastLeaderboard(): Promise<void>
   ```
   Sends the current leaderboard state to all connected WebSocket clients.
   - Retrieves the current leaderboard.
   - Broadcasts the leaderboard data to all connected clients.

4. **initializePlayers**
   ```typescript
   async initializePlayers(players: string[]): Promise<void>
   ```
   Sets up initial scores for a list of players.
   - Uses `redis.zadd` to add each player with the initial score (default 1000).

5. **increaseScore**
   ```typescript
   async increaseScore(player: string, scoreIncrease: number): Promise<void>
   ```
   Increases a player's score by a given amount.
   - Uses `redis.zincrby` to atomically increase the player's score.
   - Broadcasts the updated leaderboard.

6. **decreaseScore**
   ```typescript
   async decreaseScore(player: string, scoreDecrease: number): Promise<void>
   ```
   Decreases a player's score by a given amount.
   - Uses `redis.zincrby` with a negative value to atomically decrease the player's score.
   - Broadcasts the updated leaderboard.


#### Implementation Details

- The key for the Sorted Set in Redis is 'leaderboard'.
- Each player is a member of the Sorted Set, with their score as the sorting criteria.
- The `ioredis` library is used for Redis operations:
   - `zadd`: Add or update a player's score
   - `zrevrange`: Retrieve top players
   - `zincrby`: Increase or decrease a player's score atomically

Example usage with ioredis:

```typescript
// Add or update a player's score
await this.redis.zadd('leaderboard', score, player);

// Get top 100 players
const leaderboard = await this.redis.zrevrange('leaderboard', 0, 99, 'WITHSCORES');

// Increase a player's score
await this.redis.zincrby('leaderboard', scoreIncrease, player);

// Decrease a player's score
await this.redis.zincrby('leaderboard', -scoreDecrease, player);
```

### Leaderboard Simulation

The project includes a simulation feature to demonstrate the real-time functionality of the leaderboard system. This simulation randomly increases and decreases scores for a set of predefined players, allowing you to observe the leaderboard updates in real-time.

- The simulation uses a predefined list of 10 players.
- Every 2 seconds, the simulation performs the following actions:
   1. Selects a random player from the list.
   2. Generates a random score change between 1 and 500.
   3. Randomly decides to either increase or decrease the player's score.
   4. Calls the appropriate `increaseScore` or `decreaseScore` function on the LeaderboardManager.
   5. Logs the action and the updated leaderboard to the console.


The simulation is implemented in a separate file, typically named `simulation.ts`. Here's an overview of its key components:

```typescript
import { LeaderboardManager } from './LeaderboardManager';

const players = [
  'Alice', 'Bob', 'Charlie', 'David', 'Eve',
  'Frank', 'Grace', 'Henry', 'Isabella', 'Jack'
];

function getRandomPlayer(): string {
  return players[Math.floor(Math.random() * players.length)];
}

function getRandomScore(): number {
  return Math.floor(Math.random() * 500) + 1;
}

async function updateRandomScore(leaderboardManager: LeaderboardManager) {
  const player = getRandomPlayer();
  const scoreChange = getRandomScore();
  const isIncrease = Math.random() < 0.5;

  try {
    if (isIncrease) {
      await leaderboardManager.increaseScore(player, scoreChange);
      console.log(`Increased score for ${player}: +${scoreChange}`);
    } else {
      await leaderboardManager.decreaseScore(player, scoreChange);
      console.log(`Decreased score for ${player}: -${scoreChange}`);
    }

    const leaderboard = await leaderboardManager.getLeaderboard();
    console.log('Current Leaderboard:');
    leaderboard.forEach(entry => {
      console.log(`${entry.player}: ${entry.score}`);
    });
    console.log('------------------------');
  } catch (error) {
    console.error('Error updating score:', error);
  }
}

export async function startSimulation(leaderboardManager: LeaderboardManager) {
  // Initialize all players with a score of 1000
  await leaderboardManager.initializePlayers(players);

  // Update scores every 2 seconds
  setInterval(() => updateRandomScore(leaderboardManager), 2000);
}
```

The simulation is started automatically when the server is launched. In the main application file, you'll find:

```typescript
import { startSimulation } from './simulation';

// ... (server setup code)

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startSimulation(leaderboardManager);
  console.log('Simulation started');
});
```


### WebSocket Integration

The LeaderboardManager uses WebSocket to broadcast real-time updates:

```typescript
this.wss.clients.forEach((client) => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify({
      type: 'leaderboard_update',
      leaderboard: leaderboardData
    }));
  }
});
```

## License

This project is open source and available under the [MIT License](LICENSE).
