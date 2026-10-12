import Link from "next/link";
import type { ReactNode } from "react";

interface Mention {
  user: string;
  username: string;
}

// a # or @ only counts at the start or after a space/punctuation (same rule as the server)
const TOKEN_PATTERN =
  "(^|[^A-Za-z0-9_&@#])(@[A-Za-z0-9_]{3,20}(?![A-Za-z0-9_])|#[A-Za-z][A-Za-z0-9_]{0,29}(?![A-Za-z0-9_]))";

export default function RichText({
  text,
  mentions = [],
}: {
  text: string;
  mentions?: Mention[];
}) {
  const mentionIds = new Map(mentions.map((m) => [m.username.toLowerCase(), m.user]));
  const nodes: ReactNode[] = [];
  const re = new RegExp(TOKEN_PATTERN, "g");
  let last = 0;
  let key = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(text)) !== null) {
    const token = match[2];
    const start = match.index + match[1].length;
    if (start > last) nodes.push(text.slice(last, start));

    if (token.startsWith("#")) {
      nodes.push(
        <Link
          key={key++}
          href={`/feed/tag/${token.slice(1).toLowerCase()}`}
          className="text-blue-600 hover:underline"
        >
          {token}
        </Link>
      );
    } else {
      const userId = mentionIds.get(token.slice(1).toLowerCase());
      nodes.push(
        userId ? (
          <Link
            key={key++}
            href={`/users/${userId}`}
            className="text-blue-600 font-medium hover:underline"
          >
            {token}
          </Link>
        ) : (
          token
        )
      );
    }
    last = start + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));

  return <>{nodes}</>;
}