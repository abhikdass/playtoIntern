import React, { useState, useEffect } from 'react';
import PostCard from './PostCard';
import { feedAPI } from '../services/api';

const Feed = ({ refreshTrigger, user, onKarmaChange }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadPosts = async (page = 1, reset = false) => {
    setLoading(true);
    setError('');

    try {
      const data = await feedAPI.getPosts(page);
      
      if (reset) {
        setPosts(data.results);
      } else {
        setPosts(prev => [...prev, ...data.results]);
      }
      
      setHasMore(!!data.next);
      setCurrentPage(page);
    } catch (err) {
      setError('Failed to load posts. Please try again.');
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPosts(1, true);
  }, [refreshTrigger]);

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      loadPosts(currentPage + 1, false);
    }
  };

  const handlePostUpdate = (updatedPost) => {
    setPosts(prev => 
      prev.map(post => 
        post.id === updatedPost.id ? { ...post, ...updatedPost } : post
      )
    );
  };

  if (error) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <p style={{ color: '#dc2626', marginBottom: '1rem' }}>{error}</p>
        <button
          onClick={() => loadPosts(1, true)}
          className="btn btn-primary"
        >
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {posts.length === 0 && !loading ? (
        <div className="card fade-in" style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.5rem', color: '#111827' }}>
            No posts yet
          </h3>
          <p style={{ color: '#6b7280' }}>
            Be the first to share something with the community!
          </p>
        </div>
      ) : (
        posts.map((post, index) => (
          <div key={post.id} className="fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
            <PostCard 
              post={post} 
              user={user} 
              onUpdate={handlePostUpdate}
              onKarmaChange={onKarmaChange}
            />
          </div>
        ))
      )}

      {loading && (
        <div className="card" style={{ textAlign: 'center' }}>
          <div className="loading-spinner"></div>
          <p style={{ color: '#6b7280', marginTop: '1rem' }}>Loading awesome posts...</p>
        </div>
      )}

      {!loading && hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button
            onClick={handleLoadMore}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 2rem' }}
          >
            📚 Load More Posts
          </button>
        </div>
      )}

      {!hasMore && posts.length > 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
          <p>🎉 You've reached the end of the feed!</p>
        </div>
      )}
    </div>
  );
};

export default Feed;
