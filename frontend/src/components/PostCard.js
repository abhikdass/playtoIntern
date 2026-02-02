import React, { useState } from 'react';
import CommentSection from './CommentSection';
import { feedAPI } from '../services/api';

const PostCard = ({ post, user, onUpdate, onKarmaChange }) => {
  const [showComments, setShowComments] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(post.like_count || 0);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [commentCount, setCommentCount] = useState(post.comment_count || 0);
  const [localComments, setLocalComments] = useState(post.comments || []);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleLike = async () => {
    if (isLiking) return;
    
    // Optimistic update
    const wasLiked = isLiked;
    const prevCount = likeCount;
    setIsLiked(!wasLiked);
    setLikeCount(wasLiked ? prevCount - 1 : prevCount + 1);
    
    setIsLiking(true);
    try {
      let response;
      if (wasLiked) {
        response = await feedAPI.unlikePost(post.id);
      } else {
        response = await feedAPI.likePost(post.id);
      }

      // Update with server response
      setLikeCount(response.like_count);
      
      if (onUpdate) {
        onUpdate({
          id: post.id,
          like_count: response.like_count,
          is_liked: !wasLiked
        });
      }
    } catch (err) {
      // Revert on error
      console.error('Error toggling like:', err);
      setIsLiked(wasLiked);
      setLikeCount(prevCount);
    } finally {
      setIsLiking(false);
    }
  };

  const handleCommentCreated = (newComment) => {
    setLocalComments(prev => [...prev, newComment]);
    setCommentCount(prev => prev + 1);
    if (onUpdate) {
      onUpdate({
        id: post.id,
        comment_count: commentCount + 1
      });
    }
  };

  const getAvatarColor = (username) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
      'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* Post Header */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: getAvatarColor(post.author.username),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '700',
          fontSize: '1.25rem',
          flexShrink: 0
        }}>
          {post.author.username.charAt(0).toUpperCase()}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ 
            fontWeight: '600', 
            color: '#111827',
            margin: 0,
            fontSize: '1rem'
          }}>
            {post.author.username}
          </h3>
          <p style={{ 
            fontSize: '0.8rem', 
            color: '#6b7280',
            margin: '0.25rem 0 0 0'
          }}>
            {formatDate(post.created_at)}
          </p>
        </div>
        {post.author.karma_24h !== undefined && (
          <div style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            padding: '0.5rem 1rem',
            borderRadius: '20px',
            textAlign: 'center'
          }}>
            <div style={{ color: 'white', fontWeight: '700', fontSize: '0.9rem' }}>
              {post.author.karma_24h}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.65rem', textTransform: 'uppercase' }}>
              karma
            </div>
          </div>
        )}
      </div>

      {/* Post Content */}
      <div style={{ padding: '1.5rem' }}>
        <p style={{ 
          color: '#1f2937',
          lineHeight: '1.7',
          margin: 0,
          fontSize: '1rem',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word'
        }}>
          {post.content}
        </p>
      </div>

      {/* Post Actions */}
      <div style={{
        padding: '1rem 1.5rem',
        borderTop: '1px solid rgba(0,0,0,0.05)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={handleLike}
            disabled={isLiking}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              border: 'none',
              borderRadius: '25px',
              cursor: isLiking ? 'wait' : 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              background: isLiked 
                ? 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)' 
                : 'white',
              color: isLiked ? 'white' : '#374151',
              boxShadow: isLiked 
                ? '0 4px 15px rgba(238, 90, 36, 0.3)' 
                : '0 2px 8px rgba(0,0,0,0.1)',
              transform: isLiking ? 'scale(0.95)' : 'scale(1)',
              opacity: isLiking ? 0.7 : 1
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>{isLiked ? '❤️' : '🤍'}</span>
            <span>{likeCount}</span>
          </button>

          <button
            onClick={() => setShowComments(!showComments)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.25rem',
              border: 'none',
              borderRadius: '25px',
              cursor: 'pointer',
              fontSize: '0.9rem',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              background: showComments 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' 
                : 'white',
              color: showComments ? 'white' : '#374151',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            <span style={{ fontSize: '1.1rem' }}>💬</span>
            <span>{commentCount}</span>
          </button>
        </div>

        <div style={{
          fontSize: '0.75rem',
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          gap: '0.25rem'
        }}>
          <span>✨</span>
          <span>5 karma per like</span>
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <CommentSection
          postId={post.id}
          comments={localComments}
          user={user}
          onCommentCreated={handleCommentCreated}
        />
      )}
    </div>
  );
};

export default PostCard;
