import React, { useState } from 'react';
import { feedAPI } from '../services/api';

const CommentItem = ({ 
  comment, 
  user, 
  postId, 
  onUpdate, 
  onReplyCreated, 
  depth = 0 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

  const maxDepth = 3;

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleLike = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    try {
      let response;
      if (comment.is_liked) {
        response = await feedAPI.unlikeComment(comment.id);
      } else {
        response = await feedAPI.likeComment(comment.id);
      }
      
      onUpdate(comment.id, {
        like_count: response.like_count,
        is_liked: !comment.is_liked
      });
    } catch (err) {
      console.error('Error toggling comment like:', err);
    } finally {
      setIsLiking(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setIsSubmittingReply(true);
    try {
      const newReply = await feedAPI.createComment(postId, replyContent, comment.id);
      onReplyCreated(comment.id, newReply);
      setReplyContent('');
      setShowReplyForm(false);
    } catch (err) {
      console.error('Error creating reply:', err);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  const getAvatarColor = (username) => {
    const colors = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
      'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
      'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    ];
    const index = username.charCodeAt(0) % colors.length;
    return colors[index];
  };

  return (
    <div style={{ marginLeft: depth > 0 ? '24px' : '0' }}>
      <div style={{
        display: 'flex',
        gap: '0.75rem',
        padding: '1rem',
        background: depth === 0 ? 'white' : 'rgba(255,255,255,0.7)',
        borderRadius: '12px',
        border: depth === 0 ? '1px solid rgba(0,0,0,0.08)' : 'none',
        borderLeft: depth > 0 ? '3px solid rgba(102, 126, 234, 0.3)' : 'none'
      }}>
        {/* Avatar */}
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          background: getAvatarColor(comment.author.username),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: '600',
          fontSize: '0.75rem',
          flexShrink: 0
        }}>
          {comment.author.username.charAt(0).toUpperCase()}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: '600', fontSize: '0.85rem', color: '#1f2937' }}>
              {comment.author.username}
            </span>
            <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
              {formatDate(comment.created_at)}
            </span>
            {comment.author.karma_24h !== undefined && comment.author.karma_24h > 0 && (
              <span style={{
                fontSize: '0.65rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                padding: '0.15rem 0.5rem',
                borderRadius: '10px',
                fontWeight: '600'
              }}>
                {comment.author.karma_24h} karma
              </span>
            )}
          </div>

          {/* Comment text */}
          <p style={{
            fontSize: '0.9rem',
            color: '#374151',
            margin: '0.5rem 0',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {comment.content}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <button
              onClick={handleLike}
              disabled={isLiking}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.35rem',
                padding: '0.3rem 0.75rem',
                border: 'none',
                borderRadius: '15px',
                background: comment.is_liked ? '#fef2f2' : 'transparent',
                color: comment.is_liked ? '#dc2626' : '#6b7280',
                cursor: isLiking ? 'wait' : 'pointer',
                fontSize: '0.8rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
                opacity: isLiking ? 0.6 : 1
              }}
            >
              <span>{comment.is_liked ? '❤️' : '🤍'}</span>
              <span>{comment.like_count}</span>
            </button>

            {depth < maxDepth && (
              <button
                onClick={() => setShowReplyForm(!showReplyForm)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.3rem 0.75rem',
                  border: 'none',
                  borderRadius: '15px',
                  background: showReplyForm ? '#eff6ff' : 'transparent',
                  color: showReplyForm ? '#2563eb' : '#6b7280',
                  cursor: 'pointer',
                  fontSize: '0.8rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>↩️</span>
                <span>Reply</span>
              </button>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <button
                onClick={() => setShowReplies(!showReplies)}
                style={{
                  padding: '0.3rem 0.75rem',
                  border: 'none',
                  background: 'transparent',
                  color: '#6b7280',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  transition: 'all 0.2s ease'
                }}
              >
                {showReplies ? '🔽' : '▶️'} {comment.replies.length} {comment.replies.length === 1 ? 'reply' : 'replies'}
              </button>
            )}

            <span style={{ fontSize: '0.7rem', color: '#d1d5db' }}>
              +1 karma
            </span>
          </div>

          {/* Reply Form */}
          {showReplyForm && (
            <form onSubmit={handleReplySubmit} style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: getAvatarColor(user.username),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: '600',
                  fontSize: '0.7rem',
                  flexShrink: 0
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder={`Reply to ${comment.author.username}...`}
                    rows={2}
                    disabled={isSubmittingReply}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      border: '2px solid rgba(0,0,0,0.1)',
                      borderRadius: '10px',
                      fontSize: '0.8rem',
                      resize: 'none',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                  <div style={{ marginTop: '0.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplyForm(false);
                        setReplyContent('');
                      }}
                      style={{
                        padding: '0.4rem 0.75rem',
                        border: 'none',
                        background: 'transparent',
                        color: '#6b7280',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        borderRadius: '6px'
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingReply || !replyContent.trim()}
                      style={{
                        padding: '0.4rem 0.75rem',
                        background: isSubmittingReply || !replyContent.trim()
                          ? '#d1d5db'
                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        cursor: isSubmittingReply || !replyContent.trim() ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isSubmittingReply ? '...' : 'Reply'}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {showReplies && comment.replies && comment.replies.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              user={user}
              postId={postId}
              onUpdate={onUpdate}
              onReplyCreated={onReplyCreated}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentItem;
