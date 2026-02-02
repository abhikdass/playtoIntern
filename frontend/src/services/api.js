import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Mock authentication for demo
// In real app, this would be handled by proper auth
const MOCK_USER_ID = 1;

export const feedAPI = {
  // Posts
  getPosts: async (page = 1) => {
    const response = await api.get(`/posts/?page=${page}`);
    return response.data;
  },

  createPost: async (content) => {
    const response = await api.post('/posts/', { 
      content,
      author: MOCK_USER_ID 
    });
    return response.data;
  },

  getPost: async (postId) => {
    const response = await api.get(`/posts/${postId}/`);
    return response.data;
  },

  likePost: async (postId) => {
    const response = await api.post(`/posts/${postId}/like/`);
    return response.data;
  },

  unlikePost: async (postId) => {
    const response = await api.delete(`/posts/${postId}/unlike/`);
    return response.data;
  },

  // Comments
  createComment: async (postId, content, parentId = null) => {
    const response = await api.post('/comments/', {
      post: postId,
      content,
      parent: parentId,
      author: MOCK_USER_ID
    });
    return response.data;
  },

  likeComment: async (commentId) => {
    const response = await api.post(`/comments/${commentId}/like/`);
    return response.data;
  },

  unlikeComment: async (commentId) => {
    const response = await api.delete(`/comments/${commentId}/unlike/`);
    return response.data;
  },

  // Leaderboard
  getLeaderboard: async () => {
    const response = await api.get('/leaderboard/');
    return response.data;
  },
};

export default api;