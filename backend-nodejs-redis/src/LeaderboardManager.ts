import Redis from 'ioredis';
import WebSocket from 'ws';

interface LeaderboardEntry {
  player: string;
  score: number;
}

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

  async addScore(player: string, score: number): Promise<void> {
    await this.updateRedisScore(player, score);
    await this.broadcastLeaderboard();
  }

  async increaseScore(player: string, scoreIncrease: number): Promise<void> {
    if (scoreIncrease < 0) {
      throw new Error('Score increase must be a positive number');
    }
    await this.redis.zincrby(LeaderboardManager.LEADERBOARD_KEY, scoreIncrease, player);
    await this.broadcastLeaderboard();
  }

  async decreaseScore(player: string, scoreDecrease: number): Promise<void> {
    if (scoreDecrease < 0) {
      throw new Error('Score decrease must be a positive number');
    }
    await this.redis.zincrby(LeaderboardManager.LEADERBOARD_KEY, -scoreDecrease, player);
    await this.broadcastLeaderboard();
  }

  async getLeaderboard(count: number = LeaderboardManager.DEFAULT_LEADERBOARD_SIZE): Promise<LeaderboardEntry[]> {
    const leaderboardData = await this.fetchLeaderboardFromRedis(count);
    return this.formatLeaderboard(leaderboardData);
  }

  async initializePlayers(players: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    players.forEach(player => {
      pipeline.zadd(LeaderboardManager.LEADERBOARD_KEY, LeaderboardManager.INITIAL_SCORE, player);
    });
    await pipeline.exec();
  }

  async updatePlayerScore(player: string, scoreChange: number): Promise<void> {
    const currentScore = await this.fetchPlayerScore(player);
    const newScore = Math.max(currentScore + scoreChange, 0);
    await this.updateRedisScore(player, newScore);
    await this.broadcastLeaderboard();
  }

  async broadcastLeaderboard(): Promise<void> {
    const leaderboard = await this.getLeaderboard();
    const message = this.createLeaderboardMessage(leaderboard);
    this.broadcastToClients(message);
  }

  private async fetchLeaderboardFromRedis(count: number): Promise<string[]> {
    return this.redis.zrevrange(LeaderboardManager.LEADERBOARD_KEY, 0, count - 1, 'WITHSCORES');
  }

  private formatLeaderboard(leaderboardData: string[]): LeaderboardEntry[] {
    const formattedLeaderboard: LeaderboardEntry[] = [];
    for (let i = 0; i < leaderboardData.length; i += 2) {
      formattedLeaderboard.push({
        player: leaderboardData[i],
        score: parseInt(leaderboardData[i + 1], 10)
      });
    }
    return formattedLeaderboard;
  }

  private async fetchPlayerScore(player: string): Promise<number> {
    const score = await this.redis.zscore(LeaderboardManager.LEADERBOARD_KEY, player);
    return score ? parseInt(score, 10) : 0;
  }

  private async updateRedisScore(player: string, score: number): Promise<void> {
    await this.redis.zadd(LeaderboardManager.LEADERBOARD_KEY, score, player);
  }

  private createLeaderboardMessage(leaderboard: LeaderboardEntry[]): string {
    return JSON.stringify({
      type: 'leaderboard_update',
      leaderboard
    });
  }

  private broadcastToClients(message: string): void {
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}
