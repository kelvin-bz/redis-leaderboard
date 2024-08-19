import React, { useState, useEffect, useRef } from 'react';

interface LeaderboardEntry {
  player: string;
  score: number;
  prevPosition?: number;
}

const CrownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 inline-block mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const PositionChange: React.FC<{ currentPosition: number; prevPosition?: number }> = ({ currentPosition, prevPosition }) => {
  if (prevPosition === undefined) {
    return <span className="text-gray-500">New</span>;
  }
  
  const change = prevPosition - currentPosition;
  
  if (change === 0) {
    return <span className="text-gray-500">●</span>;
  } else if (change > 0) {
    return (
      <span className="text-green-500">
        ▲ +{change}
      </span>
    );
  } else {
    return (
      <span className="text-red-500">
        ▼ {change}
      </span>
    );
  }
};

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const prevLeaderboardRef = useRef<LeaderboardEntry[]>([]);

  useEffect(() => {
    const ws = new WebSocket(process.env.REACT_APP_BACKEND_URL || 'ws://localhost:3000');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'leaderboard_update') {
        setLeaderboard(prevLeaderboard => {
          const newLeaderboard = data.leaderboard.map((entry: LeaderboardEntry, index: number) => {
            const prevEntry = prevLeaderboard.find(e => e.player === entry.player);
            return {
              ...entry,
              prevPosition: prevEntry ? prevLeaderboard.indexOf(prevEntry) : undefined
            };
          });
          return newLeaderboard;
        });
      }
    };

    return () => {
      ws.close();
    };
  }, []);

  useEffect(() => {
    prevLeaderboardRef.current = leaderboard;
  }, [leaderboard]);

  const hasScoreChanged = (player: string, score: number) => {
    const prevEntry = prevLeaderboardRef.current.find(entry => entry.player === entry.player);
    return prevEntry && prevEntry.score !== score;
  };

  const getRowStyle = (index: number) => {
    let style = hasScoreChanged(leaderboard[index].player, leaderboard[index].score) ? 'animate-highlight' : '';
    if (index === 0) return `${style} bg-yellow-100`;
    if (index === 1) return `${style} bg-gray-100`;
    if (index === 2) return `${style} bg-orange-100`;
    return style;
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4 text-center">Leaderboard</h1>
      <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
        <thead className="bg-gray-200 text-gray-700">
          <tr>
            <th className="py-3 px-4 text-left">Rank</th>
            <th className="py-3 px-4 text-left">Player</th>
            <th className="py-3 px-4 text-right">Score</th>
            <th className="py-3 px-4 text-center">Change</th>
          </tr>
        </thead>
        <tbody>
          {leaderboard.map((entry, index) => (
            <tr key={entry.player} className={getRowStyle(index)}>
              <td className="py-4 px-4 border-b">
                {index === 0 ? <CrownIcon /> : null}
                {index + 1}
              </td>
              <td className="py-4 px-4 border-b font-medium">
                {entry.player}
              </td>
              <td className="py-4 px-4 border-b text-right">
                {entry.score}
              </td>
              <td className="py-4 px-4 border-b text-center">
                <PositionChange currentPosition={index} prevPosition={entry.prevPosition} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Leaderboard;