import { LeaderboardManager } from './LeaderboardManager';

const players = [
  'Alice', 'Bob', 'Charlie', 'David', 'Eve',
  'Frank', 'Grace', 'Henry', 'Isabella', 'Jack'
];

function getRandomPlayer(): string {
  return players[Math.floor(Math.random() * players.length)];
}

function getRandomScore(): number {
  // Generate a score between 1 and 500 for more significant changes
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

    // Log current leaderboard state
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

async function startSimulation(leaderboardManager: LeaderboardManager) {
  // Initialize all players with a score of 1000
  await leaderboardManager.initializePlayers(players);

  // Update scores every 2 seconds
  setInterval(() => updateRandomScore(leaderboardManager), 2000);
}

export { startSimulation };
