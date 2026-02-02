from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from django.contrib.contenttypes.models import ContentType
from django.db import transaction, IntegrityError
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Post, Comment, Like
from .serializers import (
    PostSerializer, 
    CommentSerializer, 
    LikeSerializer, 
    LeaderboardUserSerializer
)
from .utils import get_leaderboard_users, get_optimized_post_with_comments


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100


class PostViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Posts with optimized queries to prevent N+1 problems
    """
    serializer_class = PostSerializer
    permission_classes = [permissions.AllowAny]  # Allow anonymous for demo
    pagination_class = StandardResultsSetPagination
    
    def get_queryset(self):
        """
        Optimized queryset that prevents N+1 queries
        Prefetches author and comment data
        """
        return Post.objects.select_related('author').prefetch_related(
            'comments__author',
            'comments__replies__author'
        ).order_by('-created_at')
    
    def perform_create(self, serializer):
        """Set the author - use demo user if not authenticated"""
        from .models import User
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            # Get or create demo user for anonymous posting
            demo_user, _ = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@example.com'}
            )
            serializer.save(author=demo_user)
    
    def retrieve(self, request, *args, **kwargs):
        """
        Optimized single post retrieval with full comment tree
        """
        post_id = kwargs.get('pk')
        post = get_optimized_post_with_comments(post_id)
        
        if not post:
            return Response(
                {'error': 'Post not found'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(post)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def like(self, request, pk=None):
        """
        Like a post with concurrency protection
        Prevents duplicate likes using database constraints
        """
        from .models import User
        post = get_object_or_404(Post, pk=pk)
        if request.user.is_authenticated:
            user = request.user
        else:
            user, _ = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@example.com'}
            )
        
        post_content_type = ContentType.objects.get_for_model(Post)
        
        try:
            with transaction.atomic():
                like, created = Like.objects.get_or_create(
                    user=user,
                    content_type=post_content_type,
                    object_id=post.id
                )
                
                if created:
                    return Response(
                        {
                            'message': 'Post liked successfully',
                            'like_count': post.like_count
                        },
                        status=status.HTTP_201_CREATED
                    )
                else:
                    return Response(
                        {
                            'message': 'You have already liked this post',
                            'like_count': post.like_count
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
        except IntegrityError:
            return Response(
                {
                    'error': 'Concurrency error - please try again',
                    'like_count': post.like_count
                },
                status=status.HTTP_409_CONFLICT
            )
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.AllowAny])
    def unlike(self, request, pk=None):
        """Remove like from a post"""
        from .models import User
        post = get_object_or_404(Post, pk=pk)
        if request.user.is_authenticated:
            user = request.user
        else:
            user, _ = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@example.com'}
            )
        
        post_content_type = ContentType.objects.get_for_model(Post)
        
        try:
            like = Like.objects.get(
                user=user,
                content_type=post_content_type,
                object_id=post.id
            )
            like.delete()
            
            return Response(
                {
                    'message': 'Post unliked successfully',
                    'like_count': post.like_count
                },
                status=status.HTTP_200_OK
            )
            
        except Like.DoesNotExist:
            return Response(
                {
                    'error': 'You have not liked this post',
                    'like_count': post.like_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class CommentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Comments with threading support
    """
    serializer_class = CommentSerializer
    permission_classes = [permissions.AllowAny]  # Allow anonymous for demo
    
    def get_queryset(self):
        """Optimized queryset for comments"""
        return Comment.objects.select_related('author', 'post').prefetch_related(
            'replies__author'
        ).order_by('created_at')
    
    def perform_create(self, serializer):
        """Set the author - use demo user if not authenticated"""
        from .models import User
        if self.request.user.is_authenticated:
            serializer.save(author=self.request.user)
        else:
            demo_user, _ = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@example.com'}
            )
            serializer.save(author=demo_user)
    
    @action(detail=True, methods=['post'], permission_classes=[permissions.AllowAny])
    def like(self, request, pk=None):
        """
        Like a comment with concurrency protection
        """
        from .models import User
        comment = get_object_or_404(Comment, pk=pk)
        if request.user.is_authenticated:
            user = request.user
        else:
            user, _ = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@example.com'}
            )
        
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        try:
            with transaction.atomic():
                like, created = Like.objects.get_or_create(
                    user=user,
                    content_type=comment_content_type,
                    object_id=comment.id
                )
                
                if created:
                    return Response(
                        {
                            'message': 'Comment liked successfully',
                            'like_count': comment.like_count
                        },
                        status=status.HTTP_201_CREATED
                    )
                else:
                    return Response(
                        {
                            'message': 'You have already liked this comment',
                            'like_count': comment.like_count
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )
                    
        except IntegrityError:
            return Response(
                {
                    'error': 'Concurrency error - please try again',
                    'like_count': comment.like_count
                },
                status=status.HTTP_409_CONFLICT
            )
    
    @action(detail=True, methods=['delete'], permission_classes=[permissions.AllowAny])
    def unlike(self, request, pk=None):
        """Remove like from a comment"""
        from .models import User
        comment = get_object_or_404(Comment, pk=pk)
        if request.user.is_authenticated:
            user = request.user
        else:
            user, _ = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@example.com'}
            )
        
        comment_content_type = ContentType.objects.get_for_model(Comment)
        
        try:
            like = Like.objects.get(
                user=user,
                content_type=comment_content_type,
                object_id=comment.id
            )
            like.delete()
            
            return Response(
                {
                    'message': 'Comment unliked successfully',
                    'like_count': comment.like_count
                },
                status=status.HTTP_200_OK
            )
            
        except Like.DoesNotExist:
            return Response(
                {
                    'error': 'You have not liked this comment',
                    'like_count': comment.like_count
                },
                status=status.HTTP_400_BAD_REQUEST
            )


class LeaderboardViewSet(viewsets.ViewSet):
    """
    ViewSet for the dynamic leaderboard
    Shows top 5 users by karma earned in the last 24 hours
    """
    permission_classes = [permissions.AllowAny]
    
    def list(self, request):
        """
        Get top 5 users by karma earned in the last 24 hours
        Uses efficient aggregation instead of stored daily karma
        """
        top_users = get_leaderboard_users(limit=5)
        serializer = LeaderboardUserSerializer(top_users, many=True)
        
        return Response({
            'leaderboard': serializer.data,
            'period': '24 hours',
            'updated_at': timezone.now().isoformat()
        })
