import Redis from 'ioredis';
import WebSocket from 'ws';

export class LeaderboardManager {
  private redis: Redis;
  private wss: WebSocket.Server;

  constructor(redisClient: Redis, webSocketServer: WebSocket.Server) {
    this.redis = redisClient;
    this.wss = webSocketServer;
  }

  async addScore(player: string, score: number): Promise<void> {
    await this.redis.zadd('leaderboard', score, player);
    await this.broadcastLeaderboard();
  }

  async getLeaderboard(count: number = 100): Promise<Array<{player: string, score: number}>> {
    const leaderboard = await this.redis.zrevrange('leaderboard', 0, count - 1, 'WITHSCORES');
    return this.formatLeaderboard(leaderboard);
  }

  async broadcastLeaderboard(): Promise<void> {
    const leaderboard = await this.getLeaderboard();
    const message = JSON.stringify({
      type: 'leaderboard_update',
      leaderboard: leaderboard
    });

    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  private formatLeaderboard(leaderboard: string[]): Array<{player: string, score: number}> {
    const formattedLeaderboard = [];
    for (let i = 0; i < leaderboard.length; i += 2) {
      formattedLeaderboard.push({
        player: leaderboard[i],
        score: parseInt(leaderboard[i + 1])
      });
    }
    return formattedLeaderboard;
  }

  async initializePlayers(players: string[], initialScore: number = 1000): Promise<void> {
    for (const player of players) {
      await this.redis.zadd('leaderboard', initialScore, player);
    }
  }

  async updatePlayerScore(player: string, scoreChange: number): Promise<void> {
    const currentScore = await this.redis.zscore('leaderboard', player);
    let newScore = Math.max(parseInt(currentScore || '0') + scoreChange, 0);
    await this.redis.zadd('leaderboard', newScore, player);
    await this.broadcastLeaderboard();
  }
}