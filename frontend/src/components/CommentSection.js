import React, { useState, useEffect } from 'react';
import CommentItem from './CommentItem';
import { feedAPI } from '../services/api';

const CommentSection = ({ postId, comments, user, onCommentCreated }) => {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localComments, setLocalComments] = useState(comments);

  // Sync with parent when comments prop changes
  useEffect(() => {
    setLocalComments(comments);
  }, [comments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      const createdComment = await feedAPI.createComment(postId, newComment);
      setLocalComments(prev => [...prev, createdComment]);
      setNewComment('');
      if (onCommentCreated) {
        onCommentCreated(createdComment);
      }
    } catch (err) {
      console.error('Error creating comment:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentUpdate = (commentId, updates) => {
    setLocalComments(prev =>
      prev.map(comment =>
        comment.id === commentId ? { ...comment, ...updates } : comment
      )
    );
  };

  const handleReplyCreated = (parentId, newReply) => {
    setLocalComments(prev =>
      prev.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), newReply]
          };
        }
        return comment;
      })
    );
  };

  const topLevelComments = localComments.filter(comment => !comment.parent);

  return (
    <div style={{
      borderTop: '1px solid rgba(0,0,0,0.08)',
      background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)'
    }}>
      <div style={{ padding: '1.5rem' }}>
        {/* Comment Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: '600',
              fontSize: '0.9rem',
              flexShrink: 0
            }}>
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Write a thoughtful comment..."
                rows={3}
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  border: '2px solid rgba(0,0,0,0.1)',
                  borderRadius: '12px',
                  fontSize: '0.875rem',
                  resize: 'none',
                  transition: 'all 0.3s ease',
                  background: 'white',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  style={{
                    padding: '0.6rem 1.25rem',
                    background: isSubmitting || !newComment.trim()
                      ? '#d1d5db'
                      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '0.85rem',
                    fontWeight: '600',
                    cursor: isSubmitting || !newComment.trim() ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}
                >
                  {isSubmitting ? (
                    <>⏳ Posting...</>
                  ) : (
                    <>💬 Comment</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>

        {/* Comments List */}
        <div>
          {topLevelComments.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '2rem',
              color: '#9ca3af'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💭</div>
              <p style={{ margin: 0 }}>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {topLevelComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  user={user}
                  postId={postId}
                  onUpdate={handleCommentUpdate}
                  onReplyCreated={handleReplyCreated}
                  depth={0}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CommentSection;
