export type UserRole = 'user' | 'admin';

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface UserProfile {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  coverPhoto: string;
  bio: string;
  location?: string;
  website?: string;
  joinedDate: string;
  role: UserRole;
  status: UserStatus;
  isVerified?: boolean;
  friendsCount: number;
  followersCount: number;
  followingCount: number;
  postsCount: number;
  relationshipStatus?: string;
  work?: string;
  education?: string;
}

export type PostPrivacy = 'public' | 'friends' | 'only_me';

export type ReactionType = 'like' | 'love' | 'care' | 'haha' | 'wow' | 'sad' | 'angry';

export interface PostReaction {
  userId: string;
  userName: string;
  userAvatar: string;
  type: ReactionType;
  createdAt: string;
}

export interface PostMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
  caption?: string;
}

export interface CommentReply {
  id: string;
  postId: string;
  commentId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: string[]; // userIds
  isEdited?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: string[]; // userIds
  replies: CommentReply[];
  isEdited?: boolean;
}

export interface SharedPostMeta {
  originalPostId: string;
  originalAuthorId: string;
  originalAuthorName: string;
  originalAuthorUsername: string;
  originalAuthorAvatar: string;
  originalCreatedAt: string;
  originalContent: string;
  originalMedia?: PostMedia[];
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  authorVerified?: boolean;
  createdAt: string;
  updatedAt?: string;
  content: string;
  privacy: PostPrivacy;
  media?: PostMedia[];
  feeling?: {
    emoji: string;
    text: string;
  };
  location?: string;
  taggedUsers?: {
    id: string;
    name: string;
    username: string;
  }[];
  backgroundGradient?: string; // For text-only styled posts
  reactions: Record<string, ReactionType>; // userId -> ReactionType
  reactionsCount: {
    like: number;
    love: number;
    care: number;
    haha: number;
    wow: number;
    sad: number;
    angry: number;
  };
  commentsCount: number;
  sharesCount: number;
  savesCount: number;
  isEdited?: boolean;
  isPinned?: boolean;
  sharedPost?: SharedPostMeta;
  linkPreview?: {
    url: string;
    title: string;
    description: string;
    image?: string;
  };
}

export interface Story {
  id: string;
  authorId: string;
  authorName: string;
  authorUsername: string;
  authorAvatar: string;
  mediaUrl?: string;
  mediaType: 'image' | 'video' | 'text';
  textContent?: string;
  backgroundGradient?: string;
  createdAt: string;
  expiresAt: string; // usually 24h
  viewers: {
    userId: string;
    userName: string;
    userAvatar: string;
    viewedAt: string;
  }[];
}

export type FriendRequestStatus = 'pending' | 'accepted' | 'rejected';

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  receiverId: string;
  receiverName: string;
  createdAt: string;
  status: FriendRequestStatus;
  mutualFriendsCount?: number;
}

export type NotificationType =
  | 'like'
  | 'love'
  | 'comment'
  | 'comment_reply'
  | 'share'
  | 'friend_request'
  | 'friend_accept'
  | 'follow'
  | 'mention';

export interface AppNotification {
  id: string;
  userId: string; // recipient
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string;
  type: NotificationType;
  title: string;
  message: string;
  targetId?: string; // postId or userId
  targetType?: 'post' | 'profile' | 'comment';
  isRead: boolean;
  createdAt: string;
}

export type ReportCategory =
  | 'spam'
  | 'harassment'
  | 'fake_account'
  | 'hate_speech'
  | 'violence'
  | 'nudity'
  | 'fraud'
  | 'other';

export interface ContentReport {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'post' | 'comment' | 'profile' | 'story';
  targetId: string;
  targetAuthorName: string;
  targetSnippet?: string;
  category: ReportCategory;
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  type: 'post_created' | 'post_shared' | 'reaction_added' | 'comment_added' | 'friend_added' | 'followed_user' | 'post_saved';
  title: string;
  description: string;
  targetId?: string;
  createdAt: string;
}

export interface UserSettings {
  userId: string;
  // Privacy
  defaultPostPrivacy: PostPrivacy;
  whoCanSendFriendRequests: 'everyone' | 'friends_of_friends';
  whoCanFollowMe: 'everyone' | 'friends';
  searchEngineIndexing: boolean;
  showActivityStatus: boolean;
  allowTagging: boolean;
  
  // Notification Preferences
  notifyReactions: boolean;
  notifyComments: boolean;
  notifyFriendRequests: boolean;
  notifyFollows: boolean;
  notifyMentions: boolean;
  
  // Appearance
  theme: 'light' | 'dark' | 'system';
  denseFeed: boolean;
  
  // Security
  twoFactorEnabled: boolean;
}
