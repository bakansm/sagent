"use client";

import "/src/app/_styles/code-theme.css";

import Prism from "prismjs";
import "prismjs/components/prism-css";
import "prismjs/components/prism-javascript";
import "prismjs/components/prism-json";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-scss";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-typescript";
import { useEffect } from "react";

interface CodeViewProps {
  code: string;
  language: string;
}

export function CodeView({ code, language }: CodeViewProps) {
  useEffect(() => {
    Prism.highlightAll();
  }, [code, language]);

  return (
    <pre className="p-2 m-0 rounded-none border-none bg-transparent text-xs">
      <code className={`language-${language}`}>{code}</code>
    </pre>
  );
}
