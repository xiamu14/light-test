"use client";

import { useEffect, useRef } from "react";
import { createEditor } from "prism-code-editor";
import { defaultCommands } from "prism-code-editor/commands";
import { matchBrackets } from "prism-code-editor/match-brackets";
import "prism-code-editor/prism/languages/gherkin";
import "prism-code-editor/themes/vs-code-dark.css";
import "prism-code-editor/layout.css";

interface GherkinEditorProps {
  value: string;
  onChange?: (value: string) => void;
  height?: string;
  readOnly?: boolean;
}

export function GherkinEditor({
  value,
  onChange,
  height = "400px",
  readOnly = false,
}: GherkinEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<ReturnType<typeof createEditor>>(null);
  const isUpdatingFromProp = useRef(false);
  const initialValueRef = useRef(value);

  // 只在组件挂载时创建编辑器
  useEffect(() => {
    if (!containerRef.current) return;

    // 创建编辑器实例
    const editor = createEditor(
      containerRef.current,
      {
        language: "gherkin",
        // @ts-ignore
        theme: "vs-code-dark",
        lineNumbers: false,
        readOnly: readOnly,
        value: initialValueRef.current,
        onUpdate: () => {
          // 监听编辑器内容变化
          if (!isUpdatingFromProp.current && onChange && editorRef.current) {
            onChange(editorRef.current.value);
          }
        },
      },
      defaultCommands(),
      matchBrackets()
    );

    editorRef.current = editor;

    // 清理函数
    return () => {
      editor.remove();
      editorRef.current = null;
    };
  }, []); // 只在挂载时创建一次

  // 当外部 value 改变时，更新编辑器内容（通过重新挂载）
  const mountKey = useRef(0);
  useEffect(() => {
    // 如果 value 与编辑器当前值不同，且不是用户输入导致的变化
    if (editorRef.current && editorRef.current.value !== value && !isUpdatingFromProp.current) {
      // 触发重新挂载
      initialValueRef.current = value;
      mountKey.current += 1;

      // 销毁当前编辑器
      if (editorRef.current) {
        editorRef.current.remove();
        editorRef.current = null;
      }

      // 重新创建编辑器
      if (containerRef.current) {
        const editor = createEditor(
          containerRef.current,
          {
            language: "gherkin",
            // @ts-ignore
            theme: "vs-code-dark",
            lineNumbers: false,
            readOnly: readOnly,
            value: value,
            onUpdate: () => {
              if (!isUpdatingFromProp.current && onChange && editorRef.current) {
                onChange(editorRef.current.value);
              }
            },
          },
          defaultCommands(),
          matchBrackets()
        );
        editorRef.current = editor;
      }
    }
  }, [value, onChange]);

  return (
    <div
      ref={containerRef}
      className="border rounded-lg overflow-hidden prism-editor-wrapper"
      style={{ height }}
    />
  );
}
