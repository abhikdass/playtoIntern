import React, { useState } from 'react';
import './App.css';
import Feed from './components/Feed';
import Leaderboard from './components/Leaderboard';
import PostForm from './components/PostForm';

function App() {
  // Mock user for demo - in real app this would come from authentication
  const [user] = useState({ id: 1, username: 'demo_user' });
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [leaderboardRefresh, setLeaderboardRefresh] = useState(0);

  const handlePostCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleKarmaChange = () => {
    // Refresh leaderboard when karma changes (likes/comments)
    setLeaderboardRefresh(prev => prev + 1);
  };

  return (
    <div style={{ minHeight: '100vh' }}>
      <div className="container">
        {/* Modern Header */}
        <header style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ 
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '3.5rem',
              fontWeight: '700',
              margin: '0',
              textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
            }}>
              ✨ PlayTo Community Feed
            </h1>
            <p style={{ 
              color: 'rgba(255,255,255,0.9)', 
              fontSize: '1.25rem',
              fontWeight: '300',
              margin: '0.5rem 0 1.5rem 0',
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}>
              Share thoughts, engage in discussions, earn karma
            </p>
          </div>
          
          {/* Stats Banner */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '1rem'
          }}>
            <div className="badge">🎯 Posts = 5 Karma</div>
            <div className="badge">💬 Comments = 1 Karma</div>
            <div className="badge">🏆 24h Leaderboard</div>
            <div className="badge">⚡ Real-time Updates</div>
          </div>
        </header>

        <div className="grid grid-3">
          {/* Main Feed Area */}
          <div className="fade-in">
            <div style={{ marginBottom: '2rem' }}>
              <PostForm onPostCreated={handlePostCreated} user={user} />
            </div>
            <Feed refreshTrigger={refreshTrigger} user={user} onKarmaChange={handleKarmaChange} />
          </div>

          {/* Enhanced Sidebar */}
          <div className="fade-in" style={{ animationDelay: '0.2s' }}>
            <div style={{ position: 'sticky', top: '2rem' }}>
              <Leaderboard refreshTrigger={leaderboardRefresh} />
              
              {/* User Guide Card */}
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div style={{
                    width: '8px',
                    height: '40px',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    borderRadius: '4px',
                    marginRight: '1rem'
                  }}></div>
                  <h3 style={{ 
                    margin: '0', 
                    fontSize: '1.25rem', 
                    color: '#1f2937',
                    fontWeight: '600'
                  }}>
                    💡 How to Play
                  </h3>
                </div>
                
                <div style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(102, 126, 234, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>📝</span>
                    <div>
                      <strong style={{ color: '#4f46e5' }}>Create Posts</strong>
                      <br />
                      <span style={{ color: '#6b7280' }}>Share your thoughts and get 5 karma per like</span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    marginBottom: '1rem',
                    padding: '0.75rem',
                    background: 'rgba(118, 75, 162, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>💬</span>
                    <div>
                      <strong style={{ color: '#7c3aed' }}>Join Discussions</strong>
                      <br />
                      <span style={{ color: '#6b7280' }}>Comment and reply for 1 karma per like</span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start',
                    padding: '0.75rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>🏆</span>
                    <div>
                      <strong style={{ color: '#dc2626' }}>Climb Leaderboard</strong>
                      <br />
                      <span style={{ color: '#6b7280' }}>Top 5 spots for 24h karma leaders</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Stats */}
              <div className="card" style={{ marginTop: '1.5rem' }}>
                <h3 style={{ 
                  margin: '0 0 1rem 0', 
                  fontSize: '1.1rem', 
                  color: '#1f2937',
                  fontWeight: '600'
                }}>
                  📊 Community Stats
                </h3>
                <div style={{ fontSize: '0.85rem', color: '#6b7280', lineHeight: '1.5' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Posts Today</span>
                    <strong style={{ color: '#667eea' }}>12</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Comments Today</span>
                    <strong style={{ color: '#667eea' }}>34</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Active Users</span>
                    <strong style={{ color: '#667eea' }}>8</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          marginTop: '3rem', 
          padding: '2rem',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '0.875rem'
        }}>
          <div style={{ fontSize: '0.75rem' }}>
            Real-time • Scalable • Secure
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
