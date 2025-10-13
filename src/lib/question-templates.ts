/**
 * Spoiler-free discussion question templates
 * Organized by reading progress breakpoint and book characteristics
 */

export interface QuestionTemplate {
  text: string;
  category: 'style' | 'character' | 'theme' | 'structure' | 'setting' | 'general';
}

export interface BookMetadata {
  title: string;
  author: string;
  description?: string;
  genre?: string;
}

// Questions for early reading (25% breakpoint)
// Focus: First impressions, writing style, setup, initial characters
const earlyQuestions: QuestionTemplate[] = [
  {
    text: "What are your first impressions of the author's writing style? How does it affect your reading experience?",
    category: 'style'
  },
  {
    text: "What themes or questions do you think the author is setting up to explore?",
    category: 'theme'
  },
  {
    text: "How does the opening of the book draw you in (or not)? What techniques does the author use?",
    category: 'structure'
  },
  {
    text: "What's your initial reaction to the main character(s)? Do you find them compelling?",
    category: 'character'
  },
  {
    text: "How does the author establish the setting and atmosphere? What details stand out?",
    category: 'setting'
  },
  {
    text: "What questions or mysteries has the author raised so far that you're curious to see answered?",
    category: 'general'
  },
  {
    text: "Are there any passages or quotes that particularly resonated with you so far?",
    category: 'style'
  },
  {
    text: "How does this book compare to other works you've read by this author or in this genre?",
    category: 'general'
  }
];

// Questions for mid-reading (50% breakpoint)
// Focus: Character development, relationships, emerging themes, pacing
const midQuestions: QuestionTemplate[] = [
  {
    text: "How have the characters developed or changed from the beginning? What's driving these changes?",
    category: 'character'
  },
  {
    text: "What themes are becoming more prominent? How is the author exploring them?",
    category: 'theme'
  },
  {
    text: "How would you describe the pacing of the story? Does it work for you?",
    category: 'structure'
  },
  {
    text: "What relationships between characters are most interesting to you and why?",
    category: 'character'
  },
  {
    text: "Are there any symbols or recurring motifs you've noticed? What might they represent?",
    category: 'theme'
  },
  {
    text: "How has your understanding of the story's world deepened? What details enrich it?",
    category: 'setting'
  },
  {
    text: "Is the narrative structure working for you? (e.g., timeline, point of view, chapters)",
    category: 'structure'
  },
  {
    text: "What aspects of the story are you most invested in at this point?",
    category: 'general'
  },
  {
    text: "Have any of your initial predictions or expectations been challenged or confirmed?",
    category: 'general'
  }
];

// Questions for late reading (75% breakpoint)
// Focus: Complex themes, character arcs, philosophical questions, craft
const lateQuestions: QuestionTemplate[] = [
  {
    text: "What do you think the author is ultimately saying about the main themes?",
    category: 'theme'
  },
  {
    text: "How have the character relationships evolved throughout the story?",
    category: 'character'
  },
  {
    text: "What questions or moral dilemmas does this book raise for you?",
    category: 'theme'
  },
  {
    text: "How does the author balance different narrative threads or storylines?",
    category: 'structure'
  },
  {
    text: "What aspects of the author's craft (writing style, structure, character development) stand out?",
    category: 'style'
  },
  {
    text: "Are there any choices the characters have made that you find particularly interesting or questionable?",
    category: 'character'
  },
  {
    text: "How does this book engage with or comment on larger social, cultural, or philosophical issues?",
    category: 'theme'
  },
  {
    text: "What emotions has the story evoked in you as a reader?",
    category: 'general'
  }
];

// Questions for near-completion (90% breakpoint)
// Focus: Overall impact, meaning, craft mastery, reader experience
const nearEndQuestions: QuestionTemplate[] = [
  {
    text: "How has your understanding of the characters and their motivations evolved throughout the book?",
    category: 'character'
  },
  {
    text: "What do you think are the most important themes or messages in this book?",
    category: 'theme'
  },
  {
    text: "How effectively has the author woven together the various elements of the story?",
    category: 'structure'
  },
  {
    text: "What has surprised you most about this book?",
    category: 'general'
  },
  {
    text: "How does this book compare to your expectations when you started reading?",
    category: 'general'
  },
  {
    text: "What questions or ideas from this book will stay with you?",
    category: 'theme'
  },
  {
    text: "How would you describe the overall reading experience? What made it unique?",
    category: 'general'
  },
  {
    text: "What aspects of the storytelling technique did the author handle particularly well?",
    category: 'style'
  }
];

/**
 * Get question templates for a specific breakpoint
 */
export function getTemplatesForBreakpoint(breakpoint: number): QuestionTemplate[] {
  if (breakpoint <= 25) return earlyQuestions;
  if (breakpoint <= 50) return midQuestions;
  if (breakpoint <= 75) return lateQuestions;
  return nearEndQuestions;
}

/**
 * Generate spoiler-free questions for a book at a specific breakpoint
 * Returns a randomized selection of questions
 */
export function generateQuestionsForBook(
  book: BookMetadata,
  breakpoint: number,
  count: number = 3
): string[] {
  const templates = getTemplatesForBreakpoint(breakpoint);

  // Shuffle templates to get variety
  const shuffled = [...templates].sort(() => Math.random() - 0.5);

  // Take the requested number of questions
  return shuffled.slice(0, count).map(template => template.text);
}

/**
 * Generate a full set of questions for all breakpoints
 */
export function generateAllQuestions(
  book: BookMetadata,
  breakpoints: number[] = [25, 50, 75, 90],
  questionsPerBreakpoint: number = 3
): { breakpoint: number; questions: string[] }[] {
  return breakpoints.map(breakpoint => ({
    breakpoint,
    questions: generateQuestionsForBook(book, breakpoint, questionsPerBreakpoint)
  }));
}
