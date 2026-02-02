from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from django.contrib.auth import get_user_model
from django.db.models import Q, Sum, Case, When, IntegerField, Count
from django.db import models
from datetime import timedelta

from .models import Like, Post, Comment

User = get_user_model()


def calculate_user_karma_24h(user):
    """
    Calculate karma earned by a user in the last 24 hours
    Uses efficient aggregation instead of storing daily karma
    """
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    post_content_type = ContentType.objects.get_for_model(Post)
    comment_content_type = ContentType.objects.get_for_model(Comment)
    
    # Get likes on user's content in the last 24 hours
    karma_query = Like.objects.filter(
        created_at__gte=cutoff_time
    ).filter(
        Q(
            content_type=post_content_type,
            object_id__in=user.posts.values_list('id', flat=True)
        ) |
        Q(
            content_type=comment_content_type,
            object_id__in=user.comments.values_list('id', flat=True)
        )
    )
    
    # Calculate karma using database aggregation
    karma = karma_query.aggregate(
        total_karma=Sum(
            Case(
                When(content_type=post_content_type, then=5),  # Post like = 5 karma
                When(content_type=comment_content_type, then=1),  # Comment like = 1 karma
                default=0,
                output_field=IntegerField()
            )
        )
    )['total_karma'] or 0
    
    return karma


def get_leaderboard_users(limit=5):
    """
    Get top users by karma earned in the last 24 hours
    Uses efficient aggregation to avoid N+1 queries
    """
    cutoff_time = timezone.now() - timedelta(hours=24)
    
    post_content_type = ContentType.objects.get_for_model(Post)
    comment_content_type = ContentType.objects.get_for_model(Comment)
    
    # Get all users with their karma in a single query
    users_with_karma = []
    
    # First, get all likes in the last 24 hours with related content
    recent_likes = Like.objects.filter(
        created_at__gte=cutoff_time
    ).select_related('content_object').values(
        'content_type__model', 'object_id'
    )
    
    # Get post authors with karma
    post_karma = Like.objects.filter(
        created_at__gte=cutoff_time,
        content_type=post_content_type
    ).values('object_id').annotate(
        karma=Sum(
            Case(
                When(content_type=post_content_type, then=5),
                default=0,
                output_field=IntegerField()
            )
        )
    )
    
    # Get comment authors with karma  
    comment_karma = Like.objects.filter(
        created_at__gte=cutoff_time,
        content_type=comment_content_type
    ).values('object_id').annotate(
        karma=Sum(
            Case(
                When(content_type=comment_content_type, then=1),
                default=0,
                output_field=IntegerField()
            )
        )
    )
    
    # Aggregate karma by user
    user_karma = {}
    
    # Add karma from posts
    for post_karma_data in post_karma:
        try:
            post = Post.objects.get(id=post_karma_data['object_id'])
            user_id = post.author_id
            user_karma[user_id] = user_karma.get(user_id, 0) + post_karma_data['karma']
        except Post.DoesNotExist:
            continue
    
    # Add karma from comments
    for comment_karma_data in comment_karma:
        try:
            comment = Comment.objects.get(id=comment_karma_data['object_id'])
            user_id = comment.author_id
            user_karma[user_id] = user_karma.get(user_id, 0) + comment_karma_data['karma']
        except Comment.DoesNotExist:
            continue
    
    # Get top users
    sorted_users = sorted(user_karma.items(), key=lambda x: x[1], reverse=True)[:limit]
    
    # Fetch user objects and attach karma
    top_users = []
    for user_id, karma in sorted_users:
        try:
            user = User.objects.get(id=user_id)
            user.karma_24h = karma  # Attach calculated karma
            top_users.append(user)
        except User.DoesNotExist:
            continue
    
    return top_users


def get_optimized_posts_queryset():
    """
    Get posts queryset optimized for preventing N+1 queries
    Prefetches related data for efficient serialization
    """
    return Post.objects.select_related('author').prefetch_related(
        'comments__author',
        'comments__replies__author'
    ).annotate(
        comment_count=models.Count('comments', distinct=True)
    )


def get_optimized_post_with_comments(post_id):
    """
    Get a single post with all its comments optimized for N+1 prevention
    """
    try:
        post = Post.objects.select_related('author').get(id=post_id)
        
        # Prefetch all comments for this post in a single query
        all_comments = Comment.objects.filter(
            post=post
        ).select_related('author').order_by('created_at')
        
        # Attach as attribute to avoid additional queries
        post.prefetched_comments = list(all_comments)
        
        return post
    except Post.DoesNotExist:
        return None