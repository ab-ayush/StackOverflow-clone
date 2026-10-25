import { Fragment } from "react";
import type { ReactNode } from "react";

// Turns "I agree to the {terms} and {privacy}" into text with links in the right
// places, whatever order the language puts the words in.
export function formatWithElements(
  template: string,
  elements: Record<string, ReactNode>
) {
  const parts = template.split(/(\{\w+\})/g);
  return (
    <>
      {parts.map((part, index) => {
        const name = part.match(/^\{(\w+)\}$/)?.[1];
        if (name && name in elements) {
          return <Fragment key={index}>{elements[name]}</Fragment>;
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </>
  );
}