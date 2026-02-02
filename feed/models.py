from django.contrib.auth.models import AbstractUser
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models, transaction
from django.utils import timezone
from datetime import timedelta


class User(AbstractUser):
    """Extended user model for additional profile features if needed"""
    pass


class Post(models.Model):
    """A text post in the community feed"""
    author = models.ForeignKey(
        get_user_model(), 
        on_delete=models.CASCADE, 
        related_name='posts'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        
    def __str__(self):
        return f"{self.author.username}: {self.content[:50]}"
    
    @property
    def like_count(self):
        """Get the total number of likes for this post"""
        from django.contrib.contenttypes.models import ContentType
        post_ct = ContentType.objects.get_for_model(self)
        return Like.objects.filter(content_type=post_ct, object_id=self.id).count()


class Comment(models.Model):
    """Threaded comments on posts - supports nested replies like Reddit"""
    post = models.ForeignKey(
        Post, 
        on_delete=models.CASCADE, 
        related_name='comments'
    )
    author = models.ForeignKey(
        get_user_model(), 
        on_delete=models.CASCADE, 
        related_name='comments'
    )
    content = models.TextField()
    parent = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.CASCADE, 
        related_name='replies'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.author.username} on {self.post}: {self.content[:30]}"
    
    @property
    def like_count(self):
        """Get the total number of likes for this comment"""
        from django.contrib.contenttypes.models import ContentType
        comment_ct = ContentType.objects.get_for_model(self)
        return Like.objects.filter(content_type=comment_ct, object_id=self.id).count()
    
    def get_thread_depth(self):
        """Calculate the depth of this comment in the thread"""
        depth = 0
        parent = self.parent
        while parent:
            depth += 1
            parent = parent.parent
        return depth


class Like(models.Model):
    """Like model supporting both posts and comments with concurrency protection"""
    user = models.ForeignKey(
        get_user_model(), 
        on_delete=models.CASCADE, 
        related_name='likes'
    )
    
    # Generic foreign key to support both Post and Comment
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        # Prevent duplicate likes from the same user on the same object
        unique_together = ['user', 'content_type', 'object_id']
        indexes = [
            models.Index(fields=['content_type', 'object_id']),
            models.Index(fields=['created_at']),  # For leaderboard queries
        ]
    
    def __str__(self):
        return f"{self.user.username} likes {self.content_object}"
    
    @property
    def karma_value(self):
        """Calculate karma value based on content type"""
        if self.content_type.model == 'post':
            return 5  # Post like = 5 karma
        elif self.content_type.model == 'comment':
            return 1  # Comment like = 1 karma
        return 0
