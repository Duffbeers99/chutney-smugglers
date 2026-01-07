"use client";

import * as React from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Copy, CheckCircle, Loader2, RefreshCw } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

export default function ArticlePage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as Id<"curryEvents">;

  const generateArticle = useAction(api.substackArticle.generateSubstackArticle);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [article, setArticle] = React.useState<{
    html: string;
    narrative: string;
    data: any;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedType, setCopiedType] = React.useState<"html" | "markdown" | null>(null);

  // Generate article on mount
  React.useEffect(() => {
    handleGenerate();
  }, [eventId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateArticle({ eventId });

      if (result.success) {
        setArticle({
          html: result.html!,
          narrative: result.narrative!,
          data: result.data,
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to generate article");
      toast.error(err.message || "Failed to generate article");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (type: "html" | "markdown") => {
    if (!article) return;

    try {
      if (type === "html") {
        await navigator.clipboard.writeText(article.html);
      } else {
        // For markdown, we'll strip HTML tags and convert to basic markdown
        const markdown = htmlToMarkdown(article.html);
        await navigator.clipboard.writeText(markdown);
      }

      setCopiedType(type);
      toast.success(`Article copied as ${type.toUpperCase()} to clipboard`);

      setTimeout(() => {
        setCopiedType(null);
      }, 2000);
    } catch (err) {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Substack Article</h1>
            <p className="text-xs text-muted-foreground">
              Generated with AI
            </p>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Action Buttons */}
        {article && !isGenerating && (
          <div className="flex gap-2">
            <Button
              onClick={() => handleCopy("html")}
              className="flex-1"
              variant="default"
            >
              {copiedType === "html" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Copied HTML!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy HTML
                </>
              )}
            </Button>

            <Button
              onClick={() => handleCopy("markdown")}
              className="flex-1"
              variant="outline"
            >
              {copiedType === "markdown" ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Markdown
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerate}
              variant="outline"
              size="icon"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <Card>
            <CardHeader>
              <CardTitle>Generating Article...</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Claude is writing your curry review article. This may take 10-15 seconds.
                </p>
              </div>
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && !isGenerating && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleGenerate} variant="outline">
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Article Preview */}
        {article && !isGenerating && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  This is how your article will look. Copy the HTML and paste it into Substack's editor.
                </p>
              </CardHeader>
              <CardContent>
                <div
                  className="prose prose-sm max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: article.html }}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Instructions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Click "Copy HTML"</p>
                    <p className="text-muted-foreground">
                      This will copy the formatted article to your clipboard
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Open Substack Editor</p>
                    <p className="text-muted-foreground">
                      Go to your Substack dashboard and start a new post
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Paste the HTML</p>
                    <p className="text-muted-foreground">
                      Paste directly into the editor. Substack will render the HTML properly.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    4
                  </div>
                  <div>
                    <p className="font-medium">Review & Publish</p>
                    <p className="text-muted-foreground">
                      Make any final tweaks and hit publish!
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Convert HTML to basic Markdown (simplified version)
 */
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Convert headings
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, "# $1\n\n");
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, "## $1\n\n");
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, "### $1\n\n");

  // Convert paragraphs
  markdown = markdown.replace(/<p[^>]*>(.*?)<\/p>/gi, "$1\n\n");

  // Convert bold and italic
  markdown = markdown.replace(/<strong[^>]*>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<em[^>]*>(.*?)<\/em>/gi, "*$1*");

  // Convert links
  markdown = markdown.replace(/<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, "[$2]($1)");

  // Remove other HTML tags
  markdown = markdown.replace(/<[^>]+>/g, "");

  // Decode HTML entities
  markdown = markdown.replace(/&nbsp;/g, " ");
  markdown = markdown.replace(/&amp;/g, "&");
  markdown = markdown.replace(/&lt;/g, "<");
  markdown = markdown.replace(/&gt;/g, ">");
  markdown = markdown.replace(/&quot;/g, '"');

  // Clean up excessive whitespace
  markdown = markdown.replace(/\n{3,}/g, "\n\n");

  return markdown.trim();
}
