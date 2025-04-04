import React from "react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, BookOpen, ListChecks, Lightbulb, Quote, Target, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface LessonViewProps {
  title: string;
  content?: string;
}

interface ParsedLesson {
  title: string;
  summary: string;
  keyIdeas: string[];
  concepts: Array<{
    name: string;
    explanation: string;
    quotes: string[];
    applications: string[];
    relatedConcepts: string[];
    misconceptions: string[];
  }>;
  supportingEvidence: Array<{
    context: string;
    quote: string;
    significance: string;
    connections: string;
  }>;
  expertInsights: {
    expertise: string[];
    recommendations: string[];
    alternativeViews: string[];
  };
  actionSteps: Array<{
    step: string;
    prerequisites: string[];
    resources: string[];
  }>;
  additionalResources: {
    references: string[];
    tools: string[];
    frameworks: string[];
  };
}

const parseLesson = (content: string): ParsedLesson => {
  if (!content) {
    return {
      title: "No Content Available",
      summary: "The lesson content is not available yet.",
      keyIdeas: [],
      concepts: [],
      supportingEvidence: [],
      expertInsights: {
        expertise: [],
        recommendations: [],
        alternativeViews: []
      },
      actionSteps: [],
      additionalResources: {
        references: [],
        tools: [],
        frameworks: []
      }
    };
  }

  // Remove the <educational_lesson> tags if present
  const cleanContent = content.replace(/<\/?educational_lesson>/g, '').trim();
  
  // Split into sections using numbered headers
  const sections = cleanContent.split(/\n\d+\.\s+/).filter(Boolean);
  
  const [
    titleSection,
    summarySection,
    keyIdeasSection,
    conceptsSection,
    evidenceSection,
    insightsSection,
    actionSection,
    resourcesSection
  ] = sections;

  // Parse key ideas
  const keyIdeas = keyIdeasSection
    .replace('Key Ideas (Comprehensive List):', '')
    .trim()
    .split(/\n\s*•/)
    .filter(Boolean)
    .map(idea => idea.trim());

  // Parse concepts
  const conceptsText = conceptsSection.replace('Core Concepts Deep Dive:', '').trim();
  const conceptBlocks = conceptsText.split(/(?=\d+\.\s+[A-Za-z])/m).filter(Boolean);
  const concepts = conceptBlocks.map(block => {
    // Remove the number prefix and split into name and content
    const cleanBlock = block.replace(/^\d+\.\s+/, '');
    const [name, ...contentLines] = cleanBlock.split('\n').filter(Boolean);
    const content = contentLines.join('\n');
    
    // Extract explanation (everything before the first quote)
    const explanation = content.split(/["']/)[0].trim();

    // Extract quotes (text between quotes)
    const quotes = content.match(/"([^"]+)"/g)?.map(q => q.replace(/^"|"$/g, '').trim()) || [];
    
    // Extract applications (after quotes until next section or end)
    const applicationsMatch = content.split(/Applications:/i)[1];
    const applications = applicationsMatch
      ? applicationsMatch
          .split(/(?=•|\d+\.|\n\s*\n)/)
          .filter(app => app.trim().startsWith('•'))
          .map(app => app.replace(/^•\s*/, '').trim())
      : [];

    // Extract related concepts
    const relatedMatch = content.match(/Related Concepts:(.*?)(?=Misconceptions:|$)/s);
    const relatedConcepts = relatedMatch
      ? relatedMatch[1]
          .split('•')
          .map(r => r.trim())
          .filter(Boolean)
      : [];

    // Extract misconceptions
    const misconceptionsMatch = content.match(/Misconceptions:(.*?)$/s);
    const misconceptions = misconceptionsMatch
      ? misconceptionsMatch[1]
          .split('•')
          .map(m => m.trim())
          .filter(Boolean)
      : [];

    return {
      name,
      explanation,
      quotes,
      applications,
      relatedConcepts,
      misconceptions
    };
  });

  // Parse supporting evidence
  const evidenceText = evidenceSection.replace('Supporting Evidence:', '').trim();
  const evidenceBlocks = evidenceText.split(/Example \d+:/).filter(Boolean);
  const supportingEvidence = evidenceBlocks.map(block => {
    const lines = block.split('\n').filter(Boolean);
    return {
      context: lines[0].trim(),
      quote: lines.find(l => l.includes('"'))?.replace(/"/g, '').trim() || '',
      significance: lines.find(l => l.includes('Significance:'))?.replace('Significance:', '').trim() || '',
      connections: lines.find(l => l.includes('Connections:'))?.replace('Connections:', '').trim() || ''
    };
  });

  // Parse expert insights
  const insightsText = insightsSection.replace('Expert Insights:', '').trim();
  const expertInsights = {
    expertise: (insightsText.match(/(?<=Expertise:)(.*?)(?=Recommendations:|$)/s)?.[1] || '')
      .split(/•/)
      .map(e => e.trim())
      .filter(Boolean),
    recommendations: (insightsText.match(/(?<=Recommendations:)(.*?)(?=Alternative Views:|$)/s)?.[1] || '')
      .split(/•/)
      .map(r => r.trim())
      .filter(Boolean),
    alternativeViews: (insightsText.match(/(?<=Alternative Views:)(.*?)(?=$)/s)?.[1] || '')
      .split(/•/)
      .map(v => v.trim())
      .filter(Boolean)
  };

  // Parse action steps
  const actionText = actionSection.replace('Action Steps and Implementation:', '').trim();
  const actionBlocks = actionText.split(/Step \d+:/).filter(Boolean);
  const actionSteps = actionBlocks.map(block => {
    const lines = block.split('\n').filter(Boolean);
    return {
      step: lines[0].trim(),
      prerequisites: (block.match(/(?<=Prerequisites:)(.*?)(?=Resources:|$)/s)?.[1] || '')
        .split(/•/)
        .map(p => p.trim())
        .filter(Boolean),
      resources: (block.match(/(?<=Resources:)(.*?)(?=$)/s)?.[1] || '')
        .split(/•/)
        .map(r => r.trim())
        .filter(Boolean)
    };
  });

  // Parse additional resources
  const resourcesText = resourcesSection.replace('Additional Resources:', '').trim();
  const additionalResources = {
    references: (resourcesText.match(/(?<=References:)(.*?)(?=Tools:|$)/s)?.[1] || '')
      .split(/•/)
      .map(r => r.trim())
      .filter(Boolean),
    tools: (resourcesText.match(/(?<=Tools:)(.*?)(?=Frameworks:|$)/s)?.[1] || '')
      .split(/•/)
      .map(t => t.trim())
      .filter(Boolean),
    frameworks: (resourcesText.match(/(?<=Frameworks:)(.*?)(?=$)/s)?.[1] || '')
      .split(/•/)
      .map(f => f.trim())
      .filter(Boolean)
  };

  return {
    title: titleSection.replace('Title:', '').trim(),
    summary: summarySection.replace('Summary (Expanded):', '').trim(),
    keyIdeas,
    concepts,
    supportingEvidence,
    expertInsights,
    actionSteps,
    additionalResources
  };
};

export const LessonView = ({ title, content = '' }: LessonViewProps) => {
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
    <Card className="w-full max-w-4xl mx-auto">
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

          {/* Key Ideas Section */}
          <div>
            <SectionHeader title="Key Ideas" section="keyIdeas" icon={ListChecks} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "keyIdeas" ? "p-4" : "h-0"
            )}>
              <ul className="space-y-3">
                {lesson.keyIdeas.map((idea, index) => (
                  <li key={index} className="flex gap-2 text-sm">
                    <span className="font-mono text-primary">#{index + 1}</span>
                    {idea}
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
              <div className="space-y-8">
                {lesson.concepts.map((concept, index) => (
                  <div key={index} className="space-y-4">
                    <h3 className="font-semibold text-lg">{concept.name}</h3>
                    <p className="text-sm">{concept.explanation}</p>
                    
                    {concept.quotes.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Key Quotes:</h4>
                        {concept.quotes.map((quote, i) => (
                          <blockquote key={i} className="border-l-2 border-primary/50 pl-3 text-sm italic">
                            "{quote}"
                          </blockquote>
                        ))}
                      </div>
                    )}
                    
                    {concept.applications.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Applications:</h4>
                        <ul className="space-y-1">
                          {concept.applications.map((app, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-primary">•</span>
                              {app}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {concept.relatedConcepts.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Related Concepts:</h4>
                        <ul className="space-y-1">
                          {concept.relatedConcepts.map((rel, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-primary">•</span>
                              {rel}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {concept.misconceptions.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Common Misconceptions:</h4>
                        <ul className="space-y-1">
                          {concept.misconceptions.map((misc, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-primary">•</span>
                              {misc}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Supporting Evidence Section */}
          <div>
            <SectionHeader title="Supporting Evidence" section="evidence" icon={Quote} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "evidence" ? "p-4" : "h-0"
            )}>
              <div className="space-y-6">
                {lesson.supportingEvidence.map((evidence, index) => (
                  <div key={index} className="space-y-3">
                    <p className="text-sm font-medium">{evidence.context}</p>
                    <blockquote className="border-l-2 border-primary/50 pl-3 text-sm italic">
                      "{evidence.quote}"
                    </blockquote>
                    <div className="space-y-2">
                      <p className="text-sm"><span className="font-medium">Significance:</span> {evidence.significance}</p>
                      <p className="text-sm"><span className="font-medium">Connections:</span> {evidence.connections}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Expert Insights Section */}
          <div>
            <SectionHeader title="Expert Insights" section="insights" icon={Brain} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "insights" ? "p-4" : "h-0"
            )}>
              {lesson.expertInsights.expertise.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Expert Background:</h4>
                  <ul className="space-y-1">
                    {lesson.expertInsights.expertise.map((exp, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        {exp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.expertInsights.recommendations.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Key Recommendations:</h4>
                  <ul className="space-y-1">
                    {lesson.expertInsights.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.expertInsights.alternativeViews.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Alternative Viewpoints:</h4>
                  <ul className="space-y-1">
                    {lesson.expertInsights.alternativeViews.map((view, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        {view}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Action Steps Section */}
          <div>
            <SectionHeader title="Action Steps" section="actions" icon={Target} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "actions" ? "p-4" : "h-0"
            )}>
              <div className="space-y-6">
                {lesson.actionSteps.map((step, index) => (
                  <div key={index} className="space-y-3">
                    <p className="text-sm font-medium flex gap-2">
                      <span className="font-mono text-primary">#{index + 1}</span>
                      {step.step}
                    </p>
                    
                    {step.prerequisites.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Prerequisites:</h4>
                        <ul className="space-y-1">
                          {step.prerequisites.map((prereq, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-primary">•</span>
                              {prereq}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.resources.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-1">Helpful Resources:</h4>
                        <ul className="space-y-1">
                          {step.resources.map((resource, i) => (
                            <li key={i} className="text-sm flex gap-2">
                              <span className="text-primary">•</span>
                              {resource}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Additional Resources Section */}
          <div>
            <SectionHeader title="Additional Resources" section="resources" icon={BookOpen} />
            <div className={cn(
              "overflow-hidden transition-all",
              expandedSection === "resources" ? "p-4" : "h-0"
            )}>
              {lesson.additionalResources.references.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">References:</h4>
                  <ul className="space-y-1">
                    {lesson.additionalResources.references.map((ref, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        {ref}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.additionalResources.tools.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Tools & Platforms:</h4>
                  <ul className="space-y-1">
                    {lesson.additionalResources.tools.map((tool, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        {tool}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {lesson.additionalResources.frameworks.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Frameworks & Methodologies:</h4>
                  <ul className="space-y-1">
                    {lesson.additionalResources.frameworks.map((framework, i) => (
                      <li key={i} className="text-sm flex gap-2">
                        <span className="text-primary">•</span>
                        {framework}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </Card>
  );
}; 