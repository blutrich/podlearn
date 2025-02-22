import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BookOpen, ListChecks, Lightbulb, Quote, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonViewProps {
  title: string;
  content: string;
}

interface ParsedLesson {
  title: string;
  summary: string;
  takeaways: string[];
  concepts: Array<{
    name: string;
    explanation: string;
    quote: string;
    applications: string[];
  }>;
  examples: Array<{
    context: string;
    quote: string;
    insight: string;
  }>;
  actionSteps: string[];
}

const parseLesson = (content: string): ParsedLesson => {
  // Remove the <educational_lesson> tags if present
  const cleanContent = content.replace(/<\/?educational_lesson>/g, '').trim();
  
  // Split into sections using numbered headers
  const sections = cleanContent.split(/\n\d+\.\s+/).filter(Boolean);
  
  const [titleSection, summarySection, takeawaysSection, conceptsSection, examplesSection, actionStepsSection] = sections;

  // Parse concepts
  const conceptsText = conceptsSection.replace('Core Concepts Explained:', '').trim();
  const conceptBlocks = conceptsText.split(/(?=\w[\w\s]*:)/).filter(Boolean);
  const concepts = conceptBlocks.map(block => {
    const [nameHeader, ...contentLines] = block.split('\n').filter(Boolean);
    const name = nameHeader.replace(/:$/, '').trim();
    const content = contentLines.join('\n');
    
    // Extract explanation (between name and quote)
    const explanation = content.match(/^(.*?)(?="|\n\s*•)/s)?.[1]?.trim() || '';
    
    // Extract quote (between quotes)
    const quote = content.match(/"([^"]+)"/)?.[1]?.trim() || '';
    
    // Extract applications (bullet points after quote)
    const applications = content.match(/•[^•]+/g)?.map(point => 
      point.replace(/^•\s*/, '').trim()
    ) || [];

    return {
      name,
      explanation,
      quote,
      applications
    };
  });

  // Parse examples
  const examplesText = examplesSection.replace('Practical Examples:', '').trim();
  const exampleBlocks = examplesText.split(/(?=Example \d:)/).filter(Boolean);
  const examples = exampleBlocks.map(block => {
    const lines = block.split('\n').filter(Boolean);
    const context = lines[0].replace(/Example \d:/, '').trim();
    const quote = lines.find(line => line.startsWith('"'))?.replace(/"/g, '').trim() || '';
    const insight = lines[lines.length - 1].trim();

    return {
      context,
      quote,
      insight
    };
  });

  return {
    title: titleSection.replace('Title:', '').trim(),
    summary: summarySection.replace('Summary:', '').trim(),
    takeaways: takeawaysSection.replace('Top 3 Takeaways:', '')
      .trim()
      .split(/•/)
      .filter(Boolean)
      .map(point => point.trim()),
    concepts,
    examples,
    actionSteps: actionStepsSection.replace('Action Steps:', '')
      .trim()
      .split(/•/)
      .filter(Boolean)
      .map(point => point.trim())
  };
};

export const LessonView = ({ title, content }: LessonViewProps) => {
  const [expandedSection, setExpandedSection] = React.useState<string | null>("summary");
  const lesson = React.useMemo(() => parseLesson(content), [content]);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const SectionHeader = ({ 
    title, 
    section, 
    icon: Icon 
  }: { 
    title: string; 
    section: string; 
    icon: React.ComponentType<any>; 
  }) => (
    <Button
      variant="ghost"
      className="w-full flex items-center justify-between p-4 hover:bg-accent/5"
      onClick={() => toggleSection(section)}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" />
        <span className="font-semibold">{title}</span>
      </div>
      {expandedSection === section ? (
        <ChevronUp className="w-5 h-5" />
      ) : (
        <ChevronDown className="w-5 h-5" />
      )}
    </Button>
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold">{lesson.title}</h1>
        <p className="text-sm text-muted-foreground mt-1">{title}</p>
      </div>

      <ScrollArea className="h-[calc(100vh-12rem)]">
        <div className="divide-y">
          {/* Summary Section */}
          <div>
            <SectionHeader title="Summary" section="summary" icon={BookOpen} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "summary" ? "p-4" : "h-0"
            )}>
              <p className="text-sm leading-relaxed">{lesson.summary}</p>
            </div>
          </div>

          {/* Takeaways Section */}
          <div>
            <SectionHeader title="Key Takeaways" section="takeaways" icon={ListChecks} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "takeaways" ? "p-4" : "h-0"
            )}>
              <ul className="space-y-3">
                {lesson.takeaways.map((takeaway, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="font-mono text-primary">#{index + 1}</span>
                    {takeaway}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Core Concepts Section */}
          <div>
            <SectionHeader title="Core Concepts" section="concepts" icon={Lightbulb} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "concepts" ? "p-4" : "h-0"
            )}>
              <div className="space-y-6">
                {lesson.concepts.map((concept, index) => (
                  <div key={index} className="space-y-3">
                    <h3 className="font-semibold">{concept.name}</h3>
                    <p className="text-sm">{concept.explanation}</p>
                    <blockquote className="border-l-2 border-primary/50 pl-3 text-sm italic">
                      "{concept.quote}"
                    </blockquote>
                    <ul className="space-y-2">
                      {concept.applications.map((point, i) => (
                        <li key={i} className="text-sm flex gap-2">
                          <span className="text-primary">•</span>
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Examples Section */}
          <div>
            <SectionHeader title="Practical Examples" section="examples" icon={Quote} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "examples" ? "p-4" : "h-0"
            )}>
              <div className="space-y-6">
                {lesson.examples.map((example, index) => (
                  <div key={index} className="space-y-3">
                    <p className="text-sm font-medium">{example.context}</p>
                    <blockquote className="border-l-2 border-primary/50 pl-3 text-sm italic">
                      "{example.quote}"
                    </blockquote>
                    <p className="text-sm text-muted-foreground">{example.insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Steps Section */}
          <div>
            <SectionHeader title="Action Steps" section="actionSteps" icon={Target} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "actionSteps" ? "p-4" : "h-0"
            )}>
              <ul className="space-y-3">
                {lesson.actionSteps.map((step, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="font-mono text-primary">#{index + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}; 