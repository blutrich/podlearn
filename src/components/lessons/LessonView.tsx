import React, { useState } from "react";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { BookOpen, Lightbulb, Quote, Target, List, CheckCircle, ArrowRight, Download, Copy, Share2, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

interface LessonViewProps {
  episode: string;
  lessonId?: string;
  showPodcast?: boolean;
  readOnly?: boolean;
}

// Type definitions for better type safety
interface Section {
  title: string;
  content: string;
  type: string;
}

interface ParsedContent {
  sections: Section[];
  rawText: string;
  title: string;
  isHebrew: boolean;
}

// Smart content parser that can handle various formats
const parseContent = (content: string): ParsedContent => {
  if (!content) return { sections: [], rawText: "No content available.", title: "", isHebrew: false };

  // Remove any XML-like tags
  const cleanContent = content.replace(/<\/?[^>]+(>|$)/g, "").trim();
  
  // Detect Hebrew content
  const hebrewRegex = /[\u0590-\u05FF]/;
  const isHebrew = hebrewRegex.test(cleanContent);
  
  // Try to extract a title from the first line if it looks like a title
  let title = "";
  let contentWithoutTitle = cleanContent;
  
  // Look for a title pattern (often the first line that doesn't end with a colon)
  const lines = cleanContent.split('\n');
  const firstLine = lines[0]?.trim();
  
  // If first line looks like a title (doesn't end with colon, isn't too long, doesn't start with number)
  if (firstLine && 
      !firstLine.endsWith(':') && 
      firstLine.length < 100 && 
      firstLine.length > 10 &&
      !firstLine.match(/^\d+\./) &&
      !firstLine.toLowerCase().includes('summary') &&
      !firstLine.toLowerCase().includes('key') &&
      !firstLine.toLowerCase().includes('action') &&
      !firstLine.includes('סיכום') &&
      !firstLine.includes('נקודות') &&
      !firstLine.includes('פעולה')) {
    title = firstLine;
    contentWithoutTitle = lines.slice(1).join('\n').trim();
  }
  
  // Try to detect sections by looking for numbered items or clear headers
  const sections: Section[] = [];
  let rawText = contentWithoutTitle;

  // Look for numbered sections (1. Title: 2. Summary: etc.)
  const numberedMatches = contentWithoutTitle.match(/\d+\.\s+([^:]+):\s*([^]*?)(?=\d+\.\s+[^:]+:|$)/g);
  if (numberedMatches && numberedMatches.length > 2) {
    numberedMatches.forEach(match => {
      const matchResult = match.match(/\d+\.\s+([^:]+):\s*([^]*)/);
      if (matchResult) {
        const [, sectionTitle, sectionContent] = matchResult;
        if (sectionTitle && sectionContent) {
          sections.push({
            title: sectionTitle.trim(),
            content: sectionContent.trim(),
            type: getSectionType(sectionTitle)
          });
        }
      }
    });
    return { sections, rawText: "", title, isHebrew };
  }

  // Look for section headers with colons
  const colonMatches = contentWithoutTitle.match(/([A-Za-z\u0590-\u05FFא-ת\s]+):\s*([^]*?)(?=[A-Za-z\u0590-\u05FFא-ת\s]+:|$)/g);
  if (colonMatches && colonMatches.length > 2) {
    colonMatches.forEach(match => {
      const matchResult = match.match(/([A-Za-z\u0590-\u05FFא-ת\s]+):\s*([^]*)/);
      if (matchResult) {
        const [, sectionTitle, sectionContent] = matchResult;
        if (sectionTitle && sectionContent && sectionTitle.length < 50) {
          sections.push({
            title: sectionTitle.trim(),
            content: sectionContent.trim(),
            type: getSectionType(sectionTitle)
          });
        }
      }
    });
    return { sections, rawText: "", title, isHebrew };
  }

  // If no clear structure, break into paragraphs
  const paragraphs = contentWithoutTitle.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  if (paragraphs.length > 1) {
    paragraphs.forEach((paragraph, index) => {
      sections.push({
        title: index === 0 ? (isHebrew ? "סקירה כללית" : "Overview") : `${isHebrew ? "חלק" : "Section"} ${index}`,
        content: paragraph.trim(),
        type: "content"
      });
    });
    return { sections, rawText: "", title, isHebrew };
  }

  return { sections: [], rawText: contentWithoutTitle, title, isHebrew };
};

const getSectionType = (title: string): string => {
  const lowerTitle = title.toLowerCase();
  
  // Hebrew section type detection
  if (title.includes('סיכום') || title.includes('סקירה') || lowerTitle.includes("summary") || lowerTitle.includes("overview") || lowerTitle.includes("compelling")) return "summary";
  if (title.includes('נקודות מפתח') || title.includes('נקודות כוח') || lowerTitle.includes("key") || lowerTitle.includes("takeaway") || lowerTitle.includes("power points") || lowerTitle.includes("main")) return "keyPoints";
  if (title.includes('תוכנית פעולה') || title.includes('צעדים') || lowerTitle.includes("action") || lowerTitle.includes("step") || lowerTitle.includes("implementation") || lowerTitle.includes("blueprint")) return "action";
  if (title.includes('מושגי ליבה') || title.includes('צלילה עמוקה') || lowerTitle.includes("concept") || lowerTitle.includes("core") || lowerTitle.includes("deep") || lowerTitle.includes("dive")) return "concepts";
  if (title.includes('תובנות מקצועיות') || title.includes('ראיות מומחה') || title.includes('הוכחות') || lowerTitle.includes("insight") || lowerTitle.includes("expert") || lowerTitle.includes("professional") || lowerTitle.includes("evidence") || lowerTitle.includes("proof")) return "insights";
  if (title.includes('משאבים') || title.includes('צעדים הבאים') || title.includes('יישומים') || lowerTitle.includes("application") || lowerTitle.includes("example") || lowerTitle.includes("use") || lowerTitle.includes("resource") || lowerTitle.includes("next steps")) return "applications";
  return "content";
};

const formatContent = (content: string, type: string, isHebrew: boolean) => {
  // Handle quotes specially
  const quoteRegex = /"([^"]*)"/g;
  const quotes = content.match(quoteRegex);
  
  // Split content by quotes to handle them separately
  let parts = content.split(quoteRegex);
  
  // Split into bullet points if content contains bullets or numbered lists
  const bulletPoints = content.split(/\n\s*[•\-\*]\s*/).filter(p => p.trim().length > 0);
  const numberedPoints = content.split(/\n\s*\d+\.\s*/).filter(p => p.trim().length > 0);
  
  // Check for quotes in content
  const hasQuotes = quotes && quotes.length > 0;
  
  // If we have clear list items, render as a list
  if (bulletPoints.length > 2 || numberedPoints.length > 2) {
    const points = bulletPoints.length > numberedPoints.length ? bulletPoints : numberedPoints;
    return (
      <div className="space-y-4">
        <ul className="space-y-4">
          {points.map((point, index) => {
            const trimmedPoint = point.trim();
            if (!trimmedPoint) return null;
            
            // Check if this point contains quotes
            const pointQuotes = trimmedPoint.match(quoteRegex);
            
            return (
              <li key={index} className={cn("flex items-start gap-3 group", isHebrew && "flex-row-reverse text-right")}>
                <div className="w-2 h-2 rounded-full bg-primary mt-3 flex-shrink-0 group-hover:bg-primary/80 transition-colors" />
                <div className="flex-1 space-y-2">
                  <span className={cn(
                    "text-sm leading-relaxed font-medium",
                    isHebrew && "font-hebrew text-right"
                  )}>
                    {trimmedPoint.replace(quoteRegex, '')}
                  </span>
                  {pointQuotes && pointQuotes.map((quote, qIndex) => (
                    <blockquote key={qIndex} className={cn(
                      "border-l-4 border-primary/30 pl-4 py-2 bg-muted/30 rounded-r-lg italic text-sm text-muted-foreground",
                      isHebrew && "border-r-4 border-l-0 pr-4 pl-0 rounded-l-lg rounded-r-none font-hebrew text-right"
                    )}>
                      {quote.replace(/"/g, '')}
                    </blockquote>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }

  // Handle content with quotes
  if (hasQuotes) {
    return (
      <div className="space-y-4">
        {parts.map((part, index) => {
          if (index % 2 === 1) {
            // This is a quote
            return (
              <blockquote key={index} className={cn(
                "border-l-4 border-primary/40 pl-6 py-4 bg-gradient-to-r from-muted/40 to-transparent rounded-r-lg",
                isHebrew && "border-r-4 border-l-0 pr-6 pl-0 bg-gradient-to-l rounded-l-lg rounded-r-none text-right"
              )}>
                <Quote className={cn("w-6 h-6 text-primary/60 mb-2", isHebrew && "mr-auto ml-0")} />
                <p className={cn(
                  "text-base leading-relaxed italic text-foreground/90 font-medium",
                  isHebrew && "font-hebrew text-right not-italic"
                )}>
                  "{part}"
                </p>
              </blockquote>
            );
          } else if (part.trim()) {
            // Regular content
            const sentences = part.split(/\.\s+/).filter(s => s.trim().length > 0);
            return (
              <div key={index} className="space-y-3">
                {sentences.map((sentence, sIndex) => (
                  <p key={sIndex} className={cn(
                    "text-sm leading-relaxed text-foreground/90",
                    isHebrew && "font-hebrew text-right"
                  )}>
                    {sentence.trim()}{sentence.trim().endsWith('.') ? '' : '.'}
                  </p>
                ))}
              </div>
            );
          }
          return null;
        })}
      </div>
    );
  }

  // Otherwise, render as formatted paragraphs
  const sentences = content.split(/\.\s+/).filter(s => s.trim().length > 0);
  
  return (
    <div className="space-y-3">
      {sentences.map((sentence, index) => (
        <p key={index} className={cn(
          "text-sm leading-relaxed text-foreground/90",
          isHebrew && "font-hebrew text-right"
        )}>
          {sentence.trim()}{sentence.trim().endsWith('.') ? '' : '.'}
        </p>
      ))}
    </div>
  );
};

const getSectionIcon = (type: string) => {
  switch (type) {
    case "summary": return Quote;
    case "keyPoints": return Lightbulb;
    case "action": return Target;
    case "concepts": return BookOpen;
    case "insights": return CheckCircle;
    case "applications": return ArrowRight;
    default: return List;
  }
};

const getSectionColor = (type: string) => {
  switch (type) {
    case "summary": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    case "keyPoints": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    case "action": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "concepts": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
    case "insights": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
    case "applications": return "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200";
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  }
};

export default function LessonView({
  episode,
  lessonId,
  showPodcast = true,
  readOnly = false
}: LessonViewProps) {
  const { sections, rawText, title, isHebrew } = React.useMemo(() => parseContent(episode), [episode]);
  const { toast } = useToast();

  // Function to copy lesson content to clipboard
  const handleCopyLesson = async () => {
    try {
      await navigator.clipboard.writeText(episode);
      toast({
        title: isHebrew ? "השיעור הועתק" : "Lesson copied",
        description: isHebrew ? "תוכן השיעור הועתק ללוח" : "Lesson content copied to clipboard",
      });
    } catch (error) {
      toast({
        title: isHebrew ? "שגיאה בהעתקה" : "Copy failed",
        description: isHebrew ? "לא ניתן להעתיק את התוכן" : "Failed to copy lesson content",
        variant: "destructive",
      });
    }
  };

  // Function to generate PDF with proper Hebrew RTL support
  const generatePDF = async () => {
    try {
      // Dynamic import of html2pdf to reduce bundle size
      const html2pdf = (await import('html2pdf.js')).default;
      
      // Wait for fonts to load
      await document.fonts.ready;
      
      // Create HTML content with proper Hebrew fonts and RTL support
      const createPDFContent = () => {
        const currentDate = new Date().toLocaleDateString(isHebrew ? 'he-IL' : 'en-US');
        const metaText = isHebrew 
          ? `תאריך יצירה: ${currentDate} | יוצר על ידי PodClass AI`
          : `Generated on ${currentDate} | Created by PodClass AI`;

        // Get the actual content to render
        const contentToRender = sections.length > 0 ? sections : (rawText ? [{ title: isHebrew ? "תוכן" : "Content", content: rawText, type: "content" as const }] : []);
        
        if (contentToRender.length === 0) {
          throw new Error("No content to generate PDF");
        }

        const htmlContent = `
          <!DOCTYPE html>
          <html dir="${isHebrew ? 'rtl' : 'ltr'}">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
                
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                
                html, body {
                  font-family: ${isHebrew ? "'Heebo', 'Arial Unicode MS', sans-serif" : "'Inter', 'Arial', sans-serif"};
                  line-height: 1.6;
                  color: #1a1a1a;
                  background: white;
                  direction: ${isHebrew ? 'rtl' : 'ltr'};
                  font-size: 14px;
                }
                
                .container {
                  max-width: 800px;
                  margin: 0 auto;
                  padding: 30px;
                }
                
                .title {
                  font-size: 24px;
                  font-weight: 700;
                  color: #6366f1;
                  margin-bottom: 15px;
                  text-align: ${isHebrew ? 'right' : 'left'};
                  line-height: 1.3;
                  word-wrap: break-word;
                }
                
                .meta {
                  font-size: 11px;
                  color: #6b7280;
                  margin-bottom: 25px;
                  text-align: ${isHebrew ? 'right' : 'left'};
                  font-style: italic;
                  border-bottom: 1px solid #e5e7eb;
                  padding-bottom: 10px;
                }
                
                .section {
                  margin-bottom: 25px;
                  page-break-inside: avoid;
                }
                
                .section-title {
                  font-size: 16px;
                  font-weight: 600;
                  color: #374151;
                  margin-bottom: 12px;
                  text-align: ${isHebrew ? 'right' : 'left'};
                  border-${isHebrew ? 'right' : 'left'}: 3px solid #6366f1;
                  padding-${isHebrew ? 'right' : 'left'}: 10px;
                  background: #f8fafc;
                }
                
                .section-content {
                  font-size: 13px;
                  line-height: 1.7;
                  color: #4b5563;
                  text-align: ${isHebrew ? 'right' : 'left'};
                  padding: 0 10px;
                }
                
                .quote {
                  background: #f1f5f9;
                  border-${isHebrew ? 'right' : 'left'}: 4px solid #6366f1;
                  padding: 12px 15px;
                  margin: 12px 0;
                  font-style: italic;
                  color: #374151;
                  border-radius: 4px;
                }
                
                .bullet-list {
                  margin: 12px 0;
                  ${isHebrew ? 'padding-right: 20px;' : 'padding-left: 20px;'}
                }
                
                .bullet-item {
                  margin-bottom: 6px;
                  position: relative;
                  ${isHebrew ? 'text-align: right;' : 'text-align: left;'}
                }
                
                .bullet-item::before {
                  content: "•";
                  color: #6366f1;
                  font-weight: bold;
                  position: absolute;
                  ${isHebrew ? 'right: -15px;' : 'left: -15px;'}
                }
                
                p {
                  margin-bottom: 10px;
                  word-wrap: break-word;
                }
                
                @page {
                  margin: 20mm;
                  size: A4;
                }
                
                @media print {
                  .container { 
                    padding: 0; 
                    max-width: none;
                  }
                  .section {
                    break-inside: avoid;
                  }
                }
              </style>
            </head>
            <body>
              <div class="container">
                ${title ? `<h1 class="title">${title}</h1>` : ''}
                <div class="meta">${metaText}</div>
                ${contentToRender.map(section => `
                  <div class="section">
                    <h2 class="section-title">${section.title}</h2>
                    <div class="section-content">
                      ${formatContentForPDF(section.content)}
                    </div>
                  </div>
                `).join('')}
              </div>
            </body>
          </html>
        `;

        return htmlContent;
      };

      // Helper function to format content for PDF
      const formatContentForPDF = (content: string) => {
        if (!content) return '';
        
        // Handle quotes
        const quoteRegex = /"([^"]*)"/g;
        let formattedContent = content;
        
        // Replace quotes with styled divs
        formattedContent = formattedContent.replace(quoteRegex, '<div class="quote">$1</div>');
        
        // Handle bullet points
        const lines = formattedContent.split('\n').filter(line => line.trim());
        const hasBullets = lines.some(line => line.trim().match(/^[•\-\*]/));
        
        if (hasBullets) {
          let result = '<div class="bullet-list">';
          lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine.match(/^[•\-\*]/)) {
              const bulletText = trimmedLine.replace(/^[•\-\*]\s*/, '');
              result += `<div class="bullet-item">${bulletText}</div>`;
            } else if (trimmedLine) {
              result += `<p>${trimmedLine}</p>`;
            }
          });
          result += '</div>';
          return result;
        }
        
        // Handle regular paragraphs
        const paragraphs = formattedContent.split('\n\n').filter(p => p.trim());
        return paragraphs.map(p => `<p>${p.trim().replace(/\n/g, '<br>')}</p>`).join('');
      };

      // Get the HTML content
      const htmlContent = createPDFContent();
      
      // Create a hidden iframe to render the content
      const iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '-9999px';
      iframe.style.width = '800px';
      iframe.style.height = '600px';
      document.body.appendChild(iframe);

      // Wait for iframe to be ready
      await new Promise<void>((resolve) => {
        iframe.onload = () => resolve();
        iframe.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent);
      });

      // Wait a bit more for fonts to load
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Configure html2pdf options
      const options = {
        margin: [15, 15, 15, 15],
        filename: `${title || 'lesson'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          foreignObjectRendering: true,
          logging: false
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['avoid-all', 'css'],
          before: '.section'
        }
      };

      // Generate PDF from iframe content
      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) {
        throw new Error('Failed to access iframe document');
      }
      
      await html2pdf().set(options).from(iframeDoc.body).save();
      
      // Clean up
      document.body.removeChild(iframe);
      
      toast({
        title: isHebrew ? "PDF הורד בהצלחה" : "PDF Downloaded",
        description: isHebrew ? "השיעור נשמר כקובץ PDF עם תמיכה מלאה בעברית" : "Lesson saved as PDF with full Hebrew support",
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      
      // Fallback to simple text-based PDF if HTML fails
      try {
        const fallbackContent = `
${title || 'Lesson'}

${sections.length > 0 ? sections.map(s => `${s.title}\n${s.content}`).join('\n\n') : rawText}

Generated by PodClass AI
${new Date().toLocaleDateString()}
        `;
        
        const blob = new Blob([fallbackContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title || 'lesson'}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({
          title: isHebrew ? "הורד כטקסט" : "Downloaded as Text",
          description: isHebrew ? "נוצרה בעיה ב-PDF, הורד כטקסט" : "PDF generation failed, downloaded as text file",
        });
      } catch (fallbackError) {
        toast({
          title: isHebrew ? "שגיאה ביצירת PDF" : "PDF Generation Failed",
          description: isHebrew ? "לא ניתן ליצור את הקובץ" : "Failed to generate file",
          variant: "destructive",
        });
      }
    }
  };

  // Function to generate DOC (RTF format) with Hebrew RTL support
  const generateDOC = () => {
    try {
      // Create RTF document with proper Hebrew RTL support
      let rtfContent = `{\\rtf1\\ansi\\deff0 {\\fonttbl {\\f0 Times New Roman;}}`;
      
      // Set document direction for Hebrew
      if (isHebrew) {
        rtfContent += `\\rtlpar\\qr`;
      } else {
        rtfContent += `\\ltrpar\\ql`;
      }

      // Add title
      if (title) {
        rtfContent += `\\fs32\\b ${title}\\b0\\fs24\\par\\par`;
      }

      // Add metadata
      const currentDate = new Date().toLocaleDateString(isHebrew ? 'he-IL' : 'en-US');
      const metaText = isHebrew 
        ? `תאריך יצירה: ${currentDate} | יוצר על ידי PodClass AI`
        : `Generated on ${currentDate} | Created by PodClass AI`;
      
      rtfContent += `\\fs20\\i ${metaText}\\i0\\par\\par`;

      // Process content
      if (sections.length > 0) {
        sections.forEach((section, index) => {
          // Section title
          rtfContent += `\\fs28\\b ${section.title}\\b0\\fs24\\par`;
          
          // Section content
          const cleanContent = section.content
            .replace(/\\/g, '\\\\')
            .replace(/\{/g, '\\{')
            .replace(/\}/g, '\\}')
            .replace(/"/g, '\\"')
            .replace(/\n/g, '\\par ');
          
          rtfContent += `${cleanContent}\\par\\par`;
        });
      } else if (rawText) {
        // Handle raw text
        const cleanRawText = rawText
          .replace(/\\/g, '\\\\')
          .replace(/\{/g, '\\{')
          .replace(/\}/g, '\\}')
          .replace(/"/g, '\\"')
          .replace(/\n\n/g, '\\par\\par ')
          .replace(/\n/g, '\\par ');
        
        rtfContent += `${cleanRawText}\\par`;
      }

      rtfContent += '}';

      // Create blob and download
      const blob = new Blob([rtfContent], { type: 'application/rtf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'lesson'}.rtf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: isHebrew ? "מסמך הורד בהצלחה" : "Document Downloaded",
        description: isHebrew ? "השיעור נשמר כקובץ RTF (ניתן לפתיחה ב-Word)" : "Lesson saved as RTF file (opens in Word)",
      });
    } catch (error) {
      console.error('Error generating RTF:', error);
      toast({
        title: isHebrew ? "שגיאה ביצירת מסמך" : "Document Generation Failed",
        description: isHebrew ? "לא ניתן ליצור את המסמך" : "Failed to generate document file",
        variant: "destructive",
      });
    }
  };

  // Function to download lesson as text file
  const handleDownloadLesson = () => {
    try {
      const blob = new Blob([episode], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title || 'lesson'}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: isHebrew ? "קובץ טקסט הורד" : "Text File Downloaded",
        description: isHebrew ? "השיעור נשמר כקובץ טקסט" : "Lesson saved as text file",
      });
    } catch (error) {
      toast({
        title: isHebrew ? "שגיאה בהורדה" : "Download failed",
        description: isHebrew ? "לא ניתן להוריד את השיעור" : "Failed to download lesson",
        variant: "destructive",
      });
    }
  };

  // Function to share lesson
  const handleShareLesson = async () => {
    const shareData = {
      title: title || (isHebrew ? "שיעור מפודקאסט" : "Podcast Lesson"),
      text: isHebrew ? "שיעור מעניין שיצרתי מפודקאסט" : "Check out this lesson I created from a podcast",
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        toast({
          title: isHebrew ? "השיעור שותף" : "Lesson shared",
          description: isHebrew ? "השיעור שותף בהצלחה" : "Lesson shared successfully",
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(`${shareData.title}\n\n${episode}\n\n${shareData.url}`);
        toast({
          title: isHebrew ? "קישור הועתק" : "Link copied",
          description: isHebrew ? "קישור לשיעור הועתק ללוח" : "Lesson link copied to clipboard",
        });
      }
    } catch (error) {
      toast({
        title: isHebrew ? "שגיאה בשיתוף" : "Share failed",
        description: isHebrew ? "לא ניתן לשתף את השיעור" : "Failed to share lesson",
        variant: "destructive",
      });
    }
  };

  if (rawText && sections.length === 0) {
    // Handle raw text content
    const paragraphs = rawText.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return (
      <div className={cn("space-y-6", isHebrew && "rtl")} dir={isHebrew ? "rtl" : "ltr"}>
        {title && (
          <div className="text-center space-y-2 mb-8">
            <h1 className={cn(
              "text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 via-primary to-blue-600 bg-clip-text text-transparent leading-tight",
              isHebrew && "font-hebrew"
            )}>
              {title}
            </h1>
            <div className="h-1 w-24 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mx-auto"></div>
          </div>
        )}
        <Card>
          <CardContent className="p-6">
            <div className={cn(
              "prose prose-gray dark:prose-invert max-w-none",
              isHebrew && "prose-rtl"
            )}>
              <div className="space-y-4">
                {paragraphs.map((paragraph, index) => (
                  <p key={index} className={cn(
                    "text-base leading-7 text-foreground/90",
                    isHebrew && "font-hebrew text-right"
                  )}>
                    {paragraph.trim()}
                  </p>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
      }

  return (
    <div className={cn("space-y-3", isHebrew && "rtl")} dir={isHebrew ? "rtl" : "ltr"}>
      {title && (
        <div className={cn(
          "text-center space-y-2 mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-50/80 via-blue-50/80 to-indigo-50/80 dark:from-purple-950/20 dark:via-blue-950/20 dark:to-indigo-950/20 border-0",
          isHebrew && "rtl"
        )}>
          <h1 className={cn(
            "text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 via-primary to-blue-600 bg-clip-text text-transparent leading-tight",
            isHebrew && "font-hebrew"
          )}>
            {title}
          </h1>
          <div className="flex items-center justify-center gap-2">
            <div className="h-0.5 w-6 bg-gradient-to-r from-purple-600 to-primary rounded-full"></div>
            <BookOpen className="w-4 h-4 text-primary" />
            <div className="h-0.5 w-6 bg-gradient-to-r from-primary to-blue-600 rounded-full"></div>
          </div>
          <p className={cn(
            "text-xs text-muted-foreground font-medium",
            isHebrew && "font-hebrew"
          )}>
            {isHebrew ? "תובנות למידה מונעות בינה מלאכותית" : "AI-Powered Learning Insights"}
          </p>
        </div>
      )}

      {/* Action buttons for lesson */}
      <div className={cn(
        "flex flex-wrap gap-2 mb-4 p-3 rounded-lg bg-muted/30",
        isHebrew && "flex-row-reverse"
      )}>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLesson}
          className="flex items-center gap-1"
        >
          <Copy className="w-3 h-3" />
          <span className={cn("text-xs", isHebrew && "font-hebrew")}>
            {isHebrew ? "העתק" : "Copy"}
          </span>
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span className={cn("text-xs", isHebrew && "font-hebrew")}>
                {isHebrew ? "הורד" : "Download"}
              </span>
              <ChevronDown className="w-2 h-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={isHebrew ? "start" : "end"} className="w-40">
            <DropdownMenuItem onClick={generatePDF}>
              <div className={cn("flex items-center gap-2 w-full", isHebrew && "flex-row-reverse")}>
                <Download className="w-3 h-3" />
                <span className={cn("text-xs", isHebrew && "font-hebrew")}>
                  {isHebrew ? "PDF הורד" : "Download PDF"}
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={generateDOC}>
              <div className={cn("flex items-center gap-2 w-full", isHebrew && "flex-row-reverse")}>
                <Download className="w-3 h-3" />
                <span className={cn("text-xs", isHebrew && "font-hebrew")}>
                  {isHebrew ? "Word הורד" : "Download DOC"}
                </span>
              </div>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDownloadLesson}>
              <div className={cn("flex items-center gap-2 w-full", isHebrew && "flex-row-reverse")}>
                <Download className="w-3 h-3" />
                <span className={cn("text-xs", isHebrew && "font-hebrew")}>
                  {isHebrew ? "טקסט הורד" : "Download Text"}
                </span>
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleShareLesson}
          className="flex items-center gap-1"
        >
          <Share2 className="w-3 h-3" />
          <span className={cn("text-xs", isHebrew && "font-hebrew")}>
            {isHebrew ? "שתף" : "Share"}
          </span>
        </Button>
      </div>
      
      {sections.map((section, index) => {
        const Icon = getSectionIcon(section.type);
        const colorClass = getSectionColor(section.type);
        
        return (
          <div key={index} className="group">
            {/* Section Header - Cleaner without big icons */}
            <div className={cn(
              "flex items-center gap-2 mb-3 pb-2 border-b border-border/30",
              isHebrew && "flex-row-reverse"
            )}>
              <Icon className={`w-4 h-4 flex-shrink-0 ${colorClass.replace('bg-', 'text-').replace('100', '600').replace('800', '600')}`} />
              <div className="flex-1 min-w-0">
                <h3 className={cn(
                  "text-base sm:text-lg font-semibold text-foreground leading-tight truncate",
                  isHebrew && "font-hebrew text-right"
                )}>
                  {section.title}
                </h3>
              </div>
              <Badge variant="outline" className={`text-xs px-2 py-0.5 ${colorClass} border-current/20`}>
                {section.type.replace(/([A-Z])/g, ' $1').trim()}
              </Badge>
            </div>

            {/* Section Content - Reduced padding */}
            <div className={cn(
              "pl-6 mb-4 pb-2",
              isHebrew && "pr-6 pl-0 text-right"
            )}>
              {formatContent(section.content, section.type, isHebrew)}
            </div>

            {/* Subtle separator between sections */}
            {index < sections.length - 1 && (
              <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent my-4" />
            )}
          </div>
        );
      })}

      {sections.length === 0 && (
        <div className="rounded-lg border border-dashed border-border/50 p-8">
          <div className="flex flex-col items-center justify-center text-center">
            <BookOpen className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <h3 className="text-base font-medium text-muted-foreground mb-1">No lesson content available</h3>
            <p className="text-sm text-muted-foreground/70 max-w-md">
              The lesson content could not be parsed or is not available yet.
            </p>
          </div>
        </div>
      )}
    </div>
  );
} 