from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.models import ContentType
from django.db import transaction, IntegrityError
from django.utils import timezone
from datetime import timedelta

from .models import Post, Comment, Like

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """User serializer for author information"""
    karma_24h = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'karma_24h']
        
    def get_karma_24h(self, obj):
        """Calculate karma earned in the last 24 hours"""
        from .utils import calculate_user_karma_24h
        return calculate_user_karma_24h(obj)


class CommentSerializer(serializers.ModelSerializer):
    """
    Recursive comment serializer for threaded comments
    Optimized to prevent N+1 queries when fetching comment trees
    """
    author = UserSerializer(read_only=True)
    replies = serializers.SerializerMethodField()
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    
    class Meta:
        model = Comment
        fields = [
            'id', 'content', 'author', 'post', 'parent', 
            'created_at', 'updated_at', 'like_count', 
            'replies', 'is_liked'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
    
    def get_replies(self, obj):
        """Get nested replies for this comment"""
        # Only include direct replies, let frontend handle deeper nesting
        if hasattr(obj, 'prefetched_replies'):
            # Use prefetched data to avoid N+1
            replies = [reply for reply in obj.prefetched_replies if reply.parent_id == obj.id]
            return CommentSerializer(replies, many=True, context=self.context).data
        else:
            # Fallback if not prefetched
            replies = obj.replies.select_related('author').all()
            return CommentSerializer(replies, many=True, context=self.context).data
    
    def get_is_liked(self, obj):
        """Check if current user has liked this comment"""
        request = self.context.get('request')
        if request:
            if request.user.is_authenticated:
                user = request.user
            else:
                # Check demo_user for anonymous requests
                from .models import User
                try:
                    user = User.objects.get(username='demo_user')
                except User.DoesNotExist:
                    return False
            return Like.objects.filter(
                user=user,
                content_type=ContentType.objects.get_for_model(Comment),
                object_id=obj.id
            ).exists()
        return False


class PostSerializer(serializers.ModelSerializer):
    """
    Post serializer with optimized comment loading
    Prevents N+1 queries when loading posts with comments
    """
    author = UserSerializer(read_only=True)
    like_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    comments = serializers.SerializerMethodField()
    comment_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Post
        fields = [
            'id', 'content', 'author', 'created_at', 'updated_at',
            'like_count', 'is_liked', 'comments', 'comment_count'
        ]
        read_only_fields = ['author', 'created_at', 'updated_at']
    
    def get_is_liked(self, obj):
        """Check if current user has liked this post"""
        request = self.context.get('request')
        if request:
            if request.user.is_authenticated:
                user = request.user
            else:
                # Check demo_user for anonymous requests
                from .models import User
                try:
                    user = User.objects.get(username='demo_user')
                except User.DoesNotExist:
                    return False
            return Like.objects.filter(
                user=user,
                content_type=ContentType.objects.get_for_model(Post),
                object_id=obj.id
            ).exists()
        return False
    
    def get_comments(self, obj):
        """
        Get threaded comments optimized for N+1 prevention
        Only returns top-level comments with their immediate replies
        """
        if hasattr(obj, 'prefetched_comments'):
            # Use prefetched data
            top_level_comments = [
                comment for comment in obj.prefetched_comments 
                if comment.parent_id is None
            ]
            
            # Attach replies to each top-level comment
            for comment in top_level_comments:
                comment.prefetched_replies = [
                    reply for reply in obj.prefetched_comments 
                    if reply.parent_id == comment.id
                ]
            
            return CommentSerializer(
                top_level_comments, 
                many=True, 
                context=self.context
            ).data
        else:
            # Fallback: fetch top-level comments with their immediate replies
            top_level_comments = obj.comments.filter(parent=None).select_related('author')
            return CommentSerializer(
                top_level_comments, 
                many=True, 
                context=self.context
            ).data
    
    def get_comment_count(self, obj):
        """Total comment count including all nested levels"""
        if hasattr(obj, 'comment_count'):
            return obj.comment_count
        return obj.comments.count()


class LikeSerializer(serializers.ModelSerializer):
    """Serializer for handling likes with concurrency protection"""
    
    class Meta:
        model = Like
        fields = ['id', 'user', 'content_type', 'object_id', 'created_at']
        read_only_fields = ['user', 'created_at']
    
    def create(self, validated_data):
        """
        Create a like with concurrency protection
        Prevents duplicate likes from the same user
        """
        from .models import User
        request = self.context['request']
        if request.user.is_authenticated:
            validated_data['user'] = request.user
        else:
            demo_user, _ = User.objects.get_or_create(
                username='demo_user',
                defaults={'email': 'demo@example.com'}
            )
            validated_data['user'] = demo_user
        
        try:
            with transaction.atomic():
                return super().create(validated_data)
        except IntegrityError:
            # User already liked this object
            raise serializers.ValidationError(
                "You have already liked this content."
            )


class LeaderboardUserSerializer(serializers.ModelSerializer):
    """Specialized serializer for leaderboard data"""
    karma_24h = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'karma_24h']
    
    def get_karma_24h(self, obj):
        """Get karma earned in the last 24 hours"""
        # This should be calculated efficiently in the view
        # to avoid N+1 queries when getting top users
        return getattr(obj, 'karma_24h', 0)