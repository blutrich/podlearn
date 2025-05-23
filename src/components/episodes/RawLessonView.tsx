import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import "@/styles/lesson-improvements.css";

interface RawLessonViewProps {
  content: string;
  title?: string;
}

export default function RawLessonView({ content, title }: RawLessonViewProps) {
  // Clean the content by removing the tags but keeping the text
  const cleanContent = content.replace(/<\/?educational_lesson>/g, '').trim();
  
  return (
    <Card className="bg-background w-full max-w-full shadow-lg border-0">
      {title && (
        <CardHeader className="p-3 sm:p-6">
          <h1 className="lesson-title lesson-text-white">{title}</h1>
        </CardHeader>
      )}
      <CardContent className="px-0">
        <ScrollArea className="h-[calc(100vh-12rem)] md:h-[calc(80vh-10rem)]">
          <div className="px-3 py-3 sm:px-6 sm:py-4">
            <div className="lesson-text lesson-text-white whitespace-pre-line">
              {cleanContent}
            </div>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 