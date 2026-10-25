const escapeHtml = (text: string) =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Turns the simple markdown used in questions and answers into HTML.
// The text is escaped first, so anything a user types is shown as text and can never run.
export const renderMarkdown = (text: string) =>
  escapeHtml(text || "")
    .replace(
      /## (.*)/g,
      '<h3 class="text-lg font-semibold mt-6 mb-3 text-gray-900">$1</h3>',
    )
    .replace(
      /```(\w+)?\n([\s\S]*?)```/g,
      '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto my-4"><code class="text-sm">$2</code></pre>',
    )
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 px-2 py-1 rounded text-sm">$1</code>',
    )
    .replace(/\n\n/g, '</p><p class="mb-4">')
    .replace(/^/, '<p class="mb-4">')
    .replace(/$/, "</p>")
    .replace(
      /\n(\d+\. .*)/g,
      '<ol class="list-decimal list-inside my-4"><li>$1</li></ol>',
    );
