export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqSection = {
  title: string;
  items: FaqItem[];
};

export const FAQ_SECTIONS: FaqSection[] = [
  {
    title: "About AISEA",
    items: [
      {
        question: "What is AISEA?",
        answer:
          "AISEA is a search engine focused on sites that explicitly publish AI-generated work and choose to be discoverable. It only indexes sites that opt in with a robots.txt directive.",
      },
      {
        question: "What does AISEA stand for?",
        answer:
          "It stands for Search Engine for AI Generated Content. The product is deliberately narrow: opt-in, publisher-driven, and easy to audit.",
      },
      {
        question: "What is an AI search engine in this case?",
        answer:
          "Here it does not mean a chatbot replacing search. It means a search engine built specifically for AI-generated publishing, with clear indexing rules and explicit publisher consent.",
      },
      {
        question: "Is AISEA a general web search engine?",
        answer:
          "No. It is not trying to crawl the whole web. It indexes a much smaller set of sites that intentionally opt in.",
      },
    ],
  },
  {
    title: "How AISEA Differs From Google",
    items: [
      {
        question: "How is AISEA different from Google?",
        answer:
          "Google is a broad web index. AISEA is a narrow index of sites that explicitly mark themselves as AI-generated and request inclusion. The scope, rules, and intent are different.",
      },
      {
        question: "Why would someone use AISEA instead of Google?",
        answer:
          "If they want to search a corpus of AI-native or AI-assisted publishing without mixing it into the rest of the web, AISEA gives them a more focused surface.",
      },
      {
        question: "Does AISEA rank the web like Google?",
        answer:
          "No. AISEA uses lightweight matching and ranking for an MVP. It is designed for clarity and opt-in discovery, not large-scale web ranking.",
      },
      {
        question: "Does AISEA replace Google?",
        answer:
          "No. It fills a different niche. Think of it as a specialized index rather than a universal search engine.",
      },
    ],
  },
  {
    title: "Indexing And Submission",
    items: [
      {
        question: "How do I get my site into AISEA?",
        answer:
          "Add ai-generated: true to your robots.txt file, then submit the site through the form at /index or /submit.",
      },
      {
        question: "What if my robots.txt does not have the directive yet?",
        answer:
          "AISEA will not index the site. The submit API and form return the snippet you need to add, and you can resubmit after updating robots.txt.",
      },
      {
        question: "What does AISEA store when it indexes a page?",
        answer:
          "It stores the page title, description, URL, short content summary, and any optional AI metadata from robots.txt.",
      },
      {
        question: "Can I ask for help with setup?",
        answer:
          "Yes. The docs page has a support form that stores your request so it can be reviewed from admin.",
      },
    ],
  },
  {
    title: "Technical Questions",
    items: [
      {
        question: "Does AISEA crawl every page on my site?",
        answer:
          "No. The crawler is intentionally conservative and only walks a limited number of HTML pages per site.",
      },
      {
        question: "Does AISEA support an API?",
        answer:
          "Yes. There are public endpoints for search, submission, crawl execution, and docs support requests. The docs page shows the current request shapes.",
      },
      {
        question: "Is there an admin area?",
        answer:
          "Yes. The admin route is protected and shows crawl runs, submissions, docs requests, and analytics.",
      },
      {
        question: "Is AISEA open to any publisher?",
        answer:
          "Yes, as long as the site explicitly opts in and the crawler can verify the directive.",
      },
    ],
  },
];

export function filterFaqSections(query: string) {
  const trimmed = query.trim().toLowerCase();

  if (!trimmed) {
    return FAQ_SECTIONS;
  }

  return FAQ_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      const haystack = `${section.title} ${item.question} ${item.answer}`.toLowerCase();
      return trimmed.split(/\s+/).every((term) => haystack.includes(term));
    }),
  })).filter((section) => section.items.length > 0);
}