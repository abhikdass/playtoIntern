#!/usr/bin/env python
"""
Sample data creation script for the Community Feed application.
Run with: python create_sample_data.py
"""
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'community_feed.settings')
django.setup()

from feed.models import User, Post, Comment, Like
from django.contrib.contenttypes.models import ContentType
import random

def create_sample_data():
    # Create sample users
    users = []
    for i in range(1, 6):
        user, created = User.objects.get_or_create(
            username=f'user{i}',
            defaults={'email': f'user{i}@example.com'}
        )
        if created:
            user.set_password('password123')
            user.save()
        users.append(user)

    # Create sample posts
    posts = []
    for i in range(1, 11):
        post, created = Post.objects.get_or_create(
            content=f'Sample post {i} content about community engagement and interesting discussions.',
            defaults={'author': random.choice(users)}
        )
        posts.append(post)

    # Create sample comments
    comments = []
    for i in range(1, 21):
        comment, created = Comment.objects.get_or_create(
            content=f'This is comment {i} on a post. Very interesting perspective!',
            defaults={
                'author': random.choice(users),
                'post': random.choice(posts)
            }
        )
        comments.append(comment)

    # Create some threaded comments
    for i in range(21, 31):
        parent_comment = random.choice(comments[:10])  # Pick from first 10 comments
        comment, created = Comment.objects.get_or_create(
            content=f'Reply {i} to another comment. I agree with your point.',
            defaults={
                'author': random.choice(users),
                'post': parent_comment.post,
                'parent': parent_comment
            }
        )

    # Create likes for posts
    post_content_type = ContentType.objects.get_for_model(Post)
    for _ in range(30):
        user = random.choice(users)
        post = random.choice(posts)
        Like.objects.get_or_create(
            user=user,
            content_type=post_content_type,
            object_id=post.id
        )

    # Create likes for comments
    comment_content_type = ContentType.objects.get_for_model(Comment)
    for _ in range(50):
        user = random.choice(users)
        comment = random.choice(comments)
        Like.objects.get_or_create(
            user=user,
            content_type=comment_content_type,
            object_id=comment.id
        )

    print(f"Created {User.objects.count()} users")
    print(f"Created {Post.objects.count()} posts")
    print(f"Created {Comment.objects.count()} comments")
    print(f"Created {Like.objects.count()} likes")
    print("Sample data ready!")

if __name__ == '__main__':
    create_sample_data()