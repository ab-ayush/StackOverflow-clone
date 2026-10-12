import { useState } from "react";
import Link from "next/link";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { useAuth } from "@/src/lib/AuthContext";
import { PostComment, ReplyState, useComments } from "@/src/lib/useComments";
import { timeAgo } from "@/src/lib/timeAgo";
import RichText from "./RichText";

const MAX_COMMENT = 1000;

interface CommentFormProps {
  initialValue?: string;
  placeholder: string;
  submitLabel: string;
  onSubmit: (text: string) => Promise<boolean>;
  onCancel?: () => void;
  autoFocus?: boolean;
}

function CommentForm({
  initialValue = "",
  placeholder,
  submitLabel,
  onSubmit,
  onCancel,
  autoFocus,
}: CommentFormProps) {
  const [text, setText] = useState(initialValue);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    const ok = await onSubmit(text);
    setSubmitting(false);
    if (ok) setText("");
  };

  return (
    <div className="space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        maxLength={MAX_COMMENT}
        autoFocus={autoFocus}
        className="min-h-16 resize-none text-sm text-gray-900 bg-white"
      />
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          onClick={handleSubmit}
          disabled={submitting || !text.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          {submitting ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

interface CommentItemProps {
  comment: PostComment;
  postAuthorId?: string;
  isReply?: boolean;
  replyState?: ReplyState;
  onLoadReplies?: (commentId: string) => void;
  onAddReply?: (text: string, parentId: string) => Promise<boolean>;
  onEdit: (comment: PostComment, text: string) => Promise<boolean>;
  onDelete: (comment: PostComment) => void;
}

function CommentItem({
  comment,
  postAuthorId,
  isReply = false,
  replyState,
  onLoadReplies,
  onAddReply,
  onEdit,
  onDelete,
}: CommentItemProps) {
  const { user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [replying, setReplying] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  const authorName = comment.author?.name || "Unknown user";
  const replyCount = comment.replyCount ?? 0;
  const isCommentAuthor = !!user && user._id === comment.author?._id;
  const canDelete =
    isCommentAuthor || (!!user && !!postAuthorId && user._id === postAuthorId);

  const toggleReplies = () => {
    if (!showReplies && !replyState?.loaded) onLoadReplies?.(comment._id);
    setShowReplies((v) => !v);
  };

  const handleReply = async (text: string) => {
    const ok = await onAddReply?.(text, comment._id);
    if (ok) {
      setReplying(false);
      setShowReplies(true);
    }
    return !!ok;
  };

  const handleDelete = () => {
    const message =
      !isReply && replyCount > 0
        ? "Delete this comment and its replies?"
        : "Delete this comment?";
    if (window.confirm(message)) onDelete(comment);
  };

  return (
    <div className="flex gap-2">
      <Avatar className="w-7 h-7 mt-1">
        <AvatarFallback className="text-xs">{authorName[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0 space-y-1">
        <div className="bg-gray-100 rounded-lg px-3 py-2">
          <div className="flex items-baseline gap-2">
            {comment.author ? (
              <Link
                href={`/users/${comment.author._id}`}
                className="text-sm font-medium text-blue-600 hover:text-blue-800"
              >
                {authorName}
              </Link>
            ) : (
              <span className="text-sm font-medium text-gray-700">
                {authorName}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {timeAgo(comment.createdAt)}
              {comment.editedAt ? " · edited" : ""}
            </span>
          </div>

          {editing ? (
            <div className="pt-2">
              <CommentForm
                initialValue={comment.content}
                placeholder="Edit your comment"
                submitLabel="Save"
                autoFocus
                onSubmit={async (text) => {
                  const ok = await onEdit(comment, text);
                  if (ok) setEditing(false);
                  return ok;
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : (
            <p className="text-sm text-gray-800 whitespace-pre-wrap break-words">
              <RichText text={comment.content} mentions={comment.mentions} />
            </p>
          )}
        </div>

        {!editing && (
          <div className="flex items-center gap-3 px-1 text-xs text-gray-500">
            {!isReply && user && (
              <button
                className="hover:text-blue-600"
                onClick={() => setReplying((v) => !v)}
              >
                Reply
              </button>
            )}
            {isCommentAuthor && (
              <button
                className="hover:text-blue-600"
                onClick={() => setEditing(true)}
              >
                Edit
              </button>
            )}
            {canDelete && (
              <button className="hover:text-red-600" onClick={handleDelete}>
                Delete
              </button>
            )}
          </div>
        )}

        {replying && (
          <div className="pt-1">
            <CommentForm
              placeholder={`Reply to ${authorName}`}
              submitLabel="Reply"
              autoFocus
              onSubmit={handleReply}
              onCancel={() => setReplying(false)}
            />
          </div>
        )}

        {!isReply && replyCount > 0 && (
          <button
            className="px-1 text-xs text-blue-600 hover:underline"
            onClick={toggleReplies}
          >
            {showReplies
              ? "Hide replies"
              : `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`}
          </button>
        )}

        {showReplies && (
          <div className="space-y-3 pt-1">
            {replyState?.items.map((reply) => (
              <CommentItem
                key={reply._id}
                comment={reply}
                postAuthorId={postAuthorId}
                isReply
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
            {replyState?.loading && (
              <p className="text-xs text-gray-500">Loading replies...</p>
            )}
            {replyState?.nextCursor && !replyState.loading && (
              <button
                className="px-1 text-xs text-blue-600 hover:underline"
                onClick={() => onLoadReplies?.(comment._id)}
              >
                View more replies
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface CommentSectionProps {
  postId: string;
  postAuthorId?: string;
  onCountChange: (delta: number) => void;
}

export default function CommentSection({
  postId,
  postAuthorId,
  onCountChange,
}: CommentSectionProps) {
  const { user } = useAuth();
  const {
    comments,
    loading,
    loadingMore,
    hasMore,
    loadMore,
    replies,
    loadReplies,
    addComment,
    editComment,
    removeComment,
  } = useComments(postId, onCountChange);

  return (
    <div className="pt-3 border-t space-y-4">
      {user ? (
        <CommentForm
          placeholder="Write a comment..."
          submitLabel="Comment"
          onSubmit={(text) => addComment(text)}
        />
      ) : (
        <p className="text-sm text-gray-500">
          <Link href="/auth" className="text-blue-600 hover:underline">
            Log in
          </Link>{" "}
          to join the conversation.
        </p>
      )}

      {loading ? (
        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto" />
      ) : comments.length === 0 ? (
        <p className="text-sm text-gray-500">No comments yet.</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <CommentItem
              key={comment._id}
              comment={comment}
              postAuthorId={postAuthorId}
              replyState={replies[comment._id]}
              onLoadReplies={loadReplies}
              onAddReply={(text, parentId) => addComment(text, parentId)}
              onEdit={editComment}
              onDelete={removeComment}
            />
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading..." : "Load more comments"}
          </Button>
        </div>
      )}
    </div>
  );
}
