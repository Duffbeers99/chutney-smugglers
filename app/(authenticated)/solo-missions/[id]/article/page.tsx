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

export default function SoloMissionArticlePage() {
  const params = useParams();
  const router = useRouter();
  const ratingId = params.id as Id<"ratings">;

  const generateArticle = useAction(api.substackArticle.generateSoloMissionArticle);

  const [isGenerating, setIsGenerating] = React.useState(false);
  const [article, setArticle] = React.useState<{
    html: string;
    narrative: string;
    title: string;
    subtitle: string;
    data: any;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedType, setCopiedType] = React.useState<"html" | "markdown" | "title" | null>(null);

  // Generate article on mount
  React.useEffect(() => {
    handleGenerate();
  }, [ratingId]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    try {
      const result = await generateArticle({ ratingId });

      if (result.success) {
        setArticle({
          html: result.html!,
          narrative: result.narrative!,
          title: result.title!,
          subtitle: result.subtitle!,
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

  const handleCopy = async (type: "html" | "markdown" | "title") => {
    if (!article) return;

    try {
      if (type === "title") {
        // Copy title and subtitle as plain text
        const titleText = `${article.title}\n${article.subtitle}`;
        await navigator.clipboard.writeText(titleText);
      } else if (type === "html") {
        // Copy as rich HTML content (not plain text) so it renders in rich text editors
        const htmlBlob = new Blob([article.html], { type: "text/html" });
        const textBlob = new Blob([article.html], { type: "text/plain" });

        await navigator.clipboard.write([
          new ClipboardItem({
            "text/html": htmlBlob,
            "text/plain": textBlob,
          }),
        ]);
      } else {
        // For markdown, we'll strip HTML tags and convert to basic markdown
        const markdown = htmlToMarkdown(article.html);
        await navigator.clipboard.writeText(markdown);
      }

      setCopiedType(type);
      const label = type === "title" ? "Title & Subtitle" : type.toUpperCase();
      toast.success(`${label} copied to clipboard`);

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
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-[oklch(0.55_0.12_85)]">Solo Mission Article</h1>
            <p className="text-sm text-muted-foreground">Generate Substack content</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-4 space-y-4">
        {isGenerating && !article ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-[oklch(0.75_0.15_85)] mb-4" />
            <p className="text-foreground font-semibold mb-2">Generating article...</p>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Claude is crafting your solo mission review. This takes about 10-20 seconds.
            </p>
          </div>
        ) : error ? (
          <Card className="card-parchment border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Generation Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={handleGenerate} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : article ? (
          <>
            {/* Copy Actions */}
            <Card className="card-parchment">
              <CardHeader>
                <CardTitle>Copy to Substack</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => handleCopy("title")}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>Title & Subtitle</span>
                  {copiedType === "title" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  onClick={() => handleCopy("html")}
                  variant="outline"
                  className="w-full justify-between"
                >
                  <span>Article Content (HTML)</span>
                  {copiedType === "html" ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Article Preview */}
            <Card className="card-parchment">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Preview</CardTitle>
                  <Button
                    onClick={handleGenerate}
                    variant="ghost"
                    size="sm"
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Regenerating...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Regenerate
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-[oklch(0.55_0.12_85)] mb-1">
                      {article.title}
                    </h2>
                    <p className="text-lg text-muted-foreground italic">{article.subtitle}</p>
                  </div>
                  <div
                    className="prose prose-sm max-w-none dark:prose-invert"
                    dangerouslySetInnerHTML={{ __html: article.html }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        ) : null}
      </main>
    </div>
  );
}

// Helper function to convert HTML to basic markdown
function htmlToMarkdown(html: string): string {
  let markdown = html;

  // Remove HTML tags (very basic conversion)
  markdown = markdown.replace(/<br\s*\/?>/gi, "\n");
  markdown = markdown.replace(/<p>/gi, "\n");
  markdown = markdown.replace(/<\/p>/gi, "\n");
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/gi, "**$1**");
  markdown = markdown.replace(/<em>(.*?)<\/em>/gi, "*$1*");
  markdown = markdown.replace(/<h1>(.*?)<\/h1>/gi, "# $1\n");
  markdown = markdown.replace(/<h2>(.*?)<\/h2>/gi, "## $1\n");
  markdown = markdown.replace(/<h3>(.*?)<\/h3>/gi, "### $1\n");
  markdown = markdown.replace(/<[^>]+>/g, "");

  // Clean up extra newlines
  markdown = markdown.replace(/\n{3,}/g, "\n\n");

  return markdown.trim();
}
