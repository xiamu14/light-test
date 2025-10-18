"use client";

import { Popover, PopoverTrigger, PopoverContent } from "@heroui/react";

interface TruncatedTextProps {
  text: string;
  maxLines?: number;
  className?: string;
}

export function TruncatedText({
  text,
  maxLines = 2,
  className = "",
}: TruncatedTextProps) {
  if (!text || text.trim() === "") {
    return <span className={className}>-</span>;
  }

  return (
    <Popover placement="top" showArrow>
      <PopoverTrigger>
        <div
          className={`cursor-pointer hover:text-primary transition-colors ${className}`}
          style={{
            display: "-webkit-box",
            WebkitLineClamp: maxLines,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
            wordBreak: "break-word",
          }}
        >
          {text}
        </div>
      </PopoverTrigger>
      <PopoverContent className="max-w-md">
        <div className="p-2 whitespace-pre-wrap break-words">{text}</div>
      </PopoverContent>
    </Popover>
  );
}
