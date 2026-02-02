import React, { useState, useEffect } from 'react';
import { feedAPI } from '../services/api';

const Leaderboard = ({ refreshTrigger }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    
    try {
      const data = await feedAPI.getLeaderboard();
      setLeaderboard(data.leaderboard);
      setLastUpdated(new Date(data.updated_at));
    } catch (err) {
      setError('Failed to load leaderboard');
      console.error('Error loading leaderboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
    
    // Refresh leaderboard every 30 seconds for more real-time updates
    const interval = setInterval(loadLeaderboard, 30 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh when refreshTrigger changes (on like/comment)
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadLeaderboard();
    }
  }, [refreshTrigger]);

  const formatTime = (date) => {
    if (!date) return '';
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRankStyle = (index) => {
    const colors = [
      { bg: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)', border: '#ffd700', text: '#92400e' },
      { bg: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)', border: '#c0c0c0', text: '#374151' },
      { bg: 'linear-gradient(135deg, #cd7f32 0%, #e8b278 100%)', border: '#cd7f32', text: '#92400e' },
    ];
    return colors[index] || { bg: 'white', border: '#e5e7eb', text: '#374151' };
  };

  const getRankEmoji = (index) => {
    const emojis = ['🥇', '🥈', '🥉'];
    return emojis[index] || `#${index + 1}`;
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1.5rem',
        color: 'white'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              🏆 Leaderboard
            </h2>
            <p style={{ fontSize: '0.75rem', opacity: 0.9, marginTop: '0.25rem' }}>
              Top karma earners (24h)
            </p>
          </div>
          <button
            onClick={loadLeaderboard}
            disabled={loading}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              color: 'white',
              cursor: 'pointer',
              fontSize: '0.75rem',
              transition: 'all 0.3s ease'
            }}
          >
            {loading ? '⏳' : '🔄'} Refresh
          </button>
        </div>
        {lastUpdated && (
          <p style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: '0.5rem' }}>
            Last updated: {formatTime(lastUpdated)}
          </p>
        )}
      </div>

      {/* Content */}
      <div style={{ padding: '1.5rem' }}>
        {error ? (
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <p style={{ color: '#dc2626', marginBottom: '0.5rem' }}>{error}</p>
            <button
              onClick={loadLeaderboard}
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem' }}
            >
              Try Again
            </button>
          </div>
        ) : loading && leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div className="loading-spinner"></div>
            <p style={{ color: '#6b7280', marginTop: '1rem', fontSize: '0.875rem' }}>
              Loading leaderboard...
            </p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>😴</div>
            <p style={{ fontSize: '0.875rem' }}>No activity in the last 24 hours</p>
            <p style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>Start posting and earning karma!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {leaderboard.map((user, index) => {
              const rankStyle = getRankStyle(index);
              return (
                <div
                  key={user.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1rem',
                    background: rankStyle.bg,
                    border: `2px solid ${rankStyle.border}`,
                    borderRadius: '12px',
                    transition: 'all 0.3s ease',
                  }}
                  className="fade-in"
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{getRankEmoji(index)}</span>
                    <div>
                      <p style={{ 
                        fontWeight: '600', 
                        color: rankStyle.text,
                        fontSize: '0.95rem',
                        margin: 0
                      }}>
                        {user.username}
                      </p>
                      {index === 0 && (
                        <p style={{ fontSize: '0.7rem', color: '#d97706', fontWeight: '500' }}>
                          👑 Top performer!
                        </p>
                      )}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ 
                      fontWeight: '700', 
                      fontSize: '1.25rem',
                      color: rankStyle.text,
                      margin: 0
                    }}>
                      {user.karma_24h}
                    </p>
                    <p style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      karma
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Karma Information */}
        <div style={{
          marginTop: '1.5rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, #dbeafe 0%, #ede9fe 100%)',
          borderRadius: '12px',
          border: '1px solid #bfdbfe'
        }}>
          <h4 style={{ 
            fontSize: '0.8rem', 
            fontWeight: '600', 
            color: '#1e40af',
            marginBottom: '0.75rem',
            margin: 0
          }}>
            💡 How to earn karma:
          </h4>
          <ul style={{ 
            fontSize: '0.75rem', 
            color: '#3730a3',
            listStyle: 'none',
            padding: 0,
            margin: '0.75rem 0 0 0'
          }}>
            <li style={{ marginBottom: '0.25rem' }}>❤️ Post likes: <strong>5 karma</strong> each</li>
            <li style={{ marginBottom: '0.25rem' }}>💬 Comment likes: <strong>1 karma</strong> each</li>
            <li>⏰ Only last 24 hours count</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
