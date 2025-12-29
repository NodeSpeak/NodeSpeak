"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import type { FormattedContentProps } from "./types";

/**
 * FormattedContent - Safely renders sanitized HTML content
 * Uses DOMPurify to prevent XSS attacks
 */
export const FormattedContent: React.FC<FormattedContentProps> = ({
  htmlContent,
}) => {
  const sanitizedHtml = useMemo(() => {
    return DOMPurify.sanitize(htmlContent);
  }, [htmlContent]);

  return (
    <div
      className="post-content prose prose-sm dark:prose-invert max-w-none text-slate-700 dark:text-slate-300 break-anywhere"
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
    />
  );
};

export default FormattedContent;
