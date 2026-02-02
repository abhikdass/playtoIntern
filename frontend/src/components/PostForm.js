import React, { useState } from 'react';
import { feedAPI } from '../services/api';

const PostForm = ({ onPostCreated, user }) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) {
      setError('Please enter some content');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await feedAPI.createPost(content);
      setContent('');
      if (onPostCreated) {
        onPostCreated();
      }
    } catch (err) {
      setError('Failed to create post. Please try again.');
      console.error('Error creating post:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="card" style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div className="avatar" style={{ marginRight: '1rem' }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        <div>
          <h2 style={{ 
            margin: '0', 
            fontSize: '1.25rem', 
            color: '#1f2937',
            fontWeight: '600'
          }}>
            ✨ Share Something Amazing
          </h2>
          <p style={{ margin: '0', color: '#6b7280', fontSize: '0.875rem' }}>
            What's on your mind, {user.username}?
          </p>
        </div>
      </div>
      
      {error && (
        <div style={{
          marginBottom: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.2)',
          borderRadius: '12px',
          color: '#dc2626'
        }}>
          <strong>⚠️ {error}</strong>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share your thoughts, ideas, or ask a question..."
            rows={4}
            className="form-control"
            disabled={isSubmitting}
            style={{ 
              resize: 'vertical',
              minHeight: '100px',
              fontSize: '1rem',
              lineHeight: '1.5'
            }}
          />
        </div>
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ 
            fontSize: '0.875rem', 
            color: content.length > 800 ? '#dc2626' : '#6b7280',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <span>📝</span>
            {content.length}/1000 characters
            {content.length > 0 && (
              <span style={{ color: '#16a34a', marginLeft: '0.5rem' }}>
                • {Math.ceil(content.length / 20)} words
              </span>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting || !content.trim()}
            className="btn btn-primary"
            style={{ 
              minWidth: '120px',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isSubmitting ? (
              <>
                <div className="loading-spinner" style={{ 
                  width: '16px', 
                  height: '16px', 
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderLeft: '2px solid white',
                  margin: '0'
                }}></div>
                Posting...
              </>
            ) : (
              <>
                🚀 Post
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PostForm;