import Redis from 'ioredis';

const redis = new Redis();

const players = [
  'Alice', 'Bob', 'Charlie', 'David', 'Eve',
  'Frank', 'Grace', 'Henry', 'Isabella', 'Jack'
];

function getRandomPlayer(): string {
  return players[Math.floor(Math.random() * players.length)];
}

function getRandomScore(): number {
  // Generate a score between -500 and 500 for more significant changes
  return Math.floor(Math.random() * 1001) - 500;
}

async function updateRandomScore() {
  const player = getRandomPlayer();
  const scoreChange = getRandomScore();

  try {
    // Get the current score of the player
    const currentScore = await redis.zscore('leaderboard', player);
    let newScore = parseInt(currentScore || '0') + scoreChange;

    // Ensure the score doesn't go below 0
    newScore = Math.max(newScore, 0);

    // Update the player's score
    await redis.zadd('leaderboard', newScore, player);
    console.log(`Updated score for ${player}: ${currentScore} -> ${newScore} (${scoreChange > 0 ? '+' : ''}${scoreChange})`);

    // Log current leaderboard state
    const leaderboard = await redis.zrevrange('leaderboard', 0, -1, 'WITHSCORES');
    console.log('Current Leaderboard:');
    for (let i = 0; i < leaderboard.length; i += 2) {
      console.log(`${leaderboard[i]}: ${leaderboard[i + 1]}`);
    }
    console.log('------------------------');
  } catch (error) {
    console.error('Error updating score:', error);
  }
}

function startSimulation() {
  // Initialize all players with a score of 1000
  players.forEach(async (player) => {
    await redis.zadd('leaderboard', 1000, player);
  });

  // Update scores every 2 seconds
  setInterval(updateRandomScore, 2000);
}

export { startSimulation };