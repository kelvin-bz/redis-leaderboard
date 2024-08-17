import { LeaderboardManager } from './LeaderboardManager';

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

async function updateRandomScore(leaderboardManager: LeaderboardManager) {
  const player = getRandomPlayer();
  const scoreChange = getRandomScore();

  try {
    await leaderboardManager.updatePlayerScore(player, scoreChange);
    console.log(`Updated score for ${player}: ${scoreChange > 0 ? '+' : ''}${scoreChange}`);

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

function startSimulation(leaderboardManager: LeaderboardManager) {
  // Initialize all players with a score of 1000
  leaderboardManager.initializePlayers(players, 1000);

  // Update scores every 2 seconds
  setInterval(() => updateRandomScore(leaderboardManager), 2000);
}

export { startSimulation };