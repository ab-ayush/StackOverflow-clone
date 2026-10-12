import { useState } from "react";
import Link from "next/link";
import {
  Bookmark,
  Edit,
  Flag,
  Heart,
  MessageCircle,
  Share2,
  Trash,
} from "lucide-react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback } from "./ui/avatar";
import PostComposer from "./PostComposer";
import CommentSection from "./CommentSection";
import FollowButton from "./FollowButton";
import { useAuth } from "@/src/lib/AuthContext";
import { Post, PostInput } from "@/src/lib/useFeed";
import { imageUrl } from "@/src/lib/imageUrl";
import { timeAgo } from "@/src/lib/timeAgo";
import RichText from "./RichText";
import ReportPostDialog from "./ReportPostDialog";

const typeLabels: Record<string, string> = {
  update: "Technical update",
  snippet: "Code snippet",
  showcase: "Project showcase",
  achievement: "Learning achievement",
};

const typeColors: Record<string, string> = {
  update: "bg-blue-100 text-blue-800",
  snippet: "bg-gray-200 text-gray-800",
  showcase: "bg-purple-100 text-purple-800",
  achievement: "bg-green-100 text-green-800",
};

interface PostCardProps {
  post: Post;
  isOwner: boolean;
  onLike: (id: string) => void;
  onBookmark: (id: string) => void;
  onShare: (id: string) => void;
  onCommentCountChange: (id: string, delta: number) => void;
  onFollow?: (authorId: string) => void;
  defaultShowComments?: boolean;
  onUpdate?: (id: string, input: PostInput) => Promise<boolean>;
  onDelete?: (id: string) => void;
}

export default function PostCard({
  post,
  isOwner,
  onLike,
  onBookmark,
  onShare,
  onCommentCountChange,
  onFollow,
  defaultShowComments = false,
  onUpdate,
  onDelete,
}: PostCardProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [showComments, setShowComments] = useState(defaultShowComments);
  const [reporting, setReporting] = useState(false);
  const authorName = post.author?.name || "Unknown user";
  const images = post.images || []; // posts created before image support have no images field
  const isSelf = !!user && post.author?._id === user._id;

  if (editing && onUpdate) {
    return (
      <PostComposer
        initial={{
          content: post.content,
          type: post.type,
          codeSnippet: post.codeSnippet || null,
          images,
        }}
        submitLabel="Save"
        onSubmit={async (input) => {
          const ok = await onUpdate(post._id, input);
          if (ok) setEditing(false);
          return ok;
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-9 h-9">
              <AvatarFallback>{authorName[0]}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                {post.author ? (
                  <Link
                    href={`/users/${post.author._id}`}
                    className="font-medium text-blue-600 hover:text-blue-800"
                  >
                    {authorName}
                  </Link>
                ) : (
                  <span className="font-medium text-gray-700">
                    {authorName}
                  </span>
                )}
                {post.author?.username && (
                  <span className="text-xs text-gray-500">
                    @{post.author.username}
                  </span>
                )}
                {post.author && onFollow && !isSelf && (
                  <FollowButton
                    following={!!post.followingAuthor}
                    onClick={() => onFollow(post.author!._id)}
                  />
                )}
              </div>
              <p className="text-xs text-gray-500">
                <Link href={`/feed/${post._id}`} className="hover:underline">
                  {timeAgo(post.createdAt)}
                </Link>
                {post.editedAt ? " · edited" : ""}
              </p>
            </div>
          </div>
          <Badge variant="secondary" className={typeColors[post.type] || ""}>
            {typeLabels[post.type] || post.type}
          </Badge>
        </div>

        <p className="text-gray-800 whitespace-pre-wrap break-words">
          <RichText text={post.content} mentions={post.mentions} />
        </p>

        {images.length > 0 && (
          <div className={images.length === 1 ? "" : "grid grid-cols-2 gap-2"}>
            {images.map((path) => (
              <a
                key={path}
                href={imageUrl(path)}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl(path)}
                  alt="Post attachment"
                  loading="lazy"
                  decoding="async"
                  className={
                    images.length === 1
                      ? "w-full max-h-96 object-contain bg-gray-50 rounded-lg border"
                      : "w-full h-48 object-cover rounded-lg border"
                  }
                />
              </a>
            ))}
          </div>
        )}

        {post.codeSnippet && (
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {post.codeSnippet.language}
            </p>
            <pre className="bg-gray-100 text-gray-900 p-3 rounded-lg overflow-x-auto text-sm">
              <code>{post.codeSnippet.code}</code>
            </pre>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 border-t">
          <div className="flex items-center gap-1 pt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onLike(post._id)}
              aria-label={post.likedByMe ? "Unlike" : "Like"}
              className={
                post.likedByMe
                  ? "text-red-600 hover:text-red-700"
                  : "text-gray-600 hover:text-red-600"
              }
            >
              <Heart
                className="w-4 h-4 mr-1"
                fill={post.likedByMe ? "currentColor" : "none"}
              />
              {post.likeCount ?? 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments((v) => !v)}
              aria-label="Comments"
              className={
                showComments
                  ? "text-blue-600 hover:text-blue-700"
                  : "text-gray-600 hover:text-blue-600"
              }
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              {post.commentCount ?? 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare(post._id)}
              aria-label="Copy link"
              className="text-gray-600 hover:text-blue-600"
            >
              <Share2 className="w-4 h-4 mr-1" />
              {post.shareCount ?? 0}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onBookmark(post._id)}
              aria-label={post.bookmarkedByMe ? "Remove bookmark" : "Bookmark"}
              className={
                post.bookmarkedByMe
                  ? "text-yellow-500 hover:text-yellow-600"
                  : "text-gray-600 hover:text-yellow-500"
              }
            >
              <Bookmark
                className="w-4 h-4"
                fill={post.bookmarkedByMe ? "currentColor" : "none"}
              />
            </Button>
          </div>

          {isOwner && onUpdate && onDelete && (
            <div className="flex gap-1 pt-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEditing(true)}
                className="text-gray-600 hover:text-gray-800"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (window.confirm("Delete this post?")) onDelete(post._id);
                }}
                className="text-red-600 hover:text-red-800"
              >
                <Trash className="w-4 h-4 mr-1" />
                Delete
              </Button>
            </div>
          )}
          {!isSelf && !!user && !!post.author && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setReporting(true)}
              aria-label="Report post"
              className="mt-1 text-gray-500 hover:text-red-600"
            >
              <Flag className="w-4 h-4 mr-1" />
              Report
            </Button>
          )}
        </div>

        {showComments && (
          <CommentSection
            postId={post._id}
            postAuthorId={post.author?._id}
            onCountChange={(delta) => onCommentCountChange(post._id, delta)}
          />
        )}
        {reporting && (
          <ReportPostDialog
            postId={post._id}
            open={reporting}
            onOpenChange={setReporting}
          />
        )}
      </CardContent>
    </Card>
  );
}
