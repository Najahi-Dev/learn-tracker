export interface ParsedTaskItem {
  id: string; // temporary client-side id for keys/toggles
  title: string;
  priority: "low" | "medium" | "high";
  subtasks: string[];
  selected?: boolean;
}

export interface PdfAnalysisResult {
  topicName: string;
  description: string;
  tasks: ParsedTaskItem[];
  totalPages: number;
  rawTextLength: number;
}

/**
 * Extracts raw text from a PDF File or ArrayBuffer using pdfjs-dist
 */
export async function extractTextFromPdf(file: File): Promise<{ text: string; totalPages: number }> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Dynamically import pdfjs-dist to ensure client-side only execution
  const pdfjsLib = await import("pdfjs-dist");
  
  // Configure worker
  if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const numPages = pdf.numPages;
  let fullText = "";

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Group text items by line
    let lastY: number | null = null;
    let pageText = "";

    for (const item of textContent.items as any[]) {
      if ("str" in item) {
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          pageText += "\n";
        } else if (pageText.length > 0 && !pageText.endsWith(" ") && !pageText.endsWith("\n")) {
          pageText += " ";
        }
        pageText += item.str;
        lastY = item.transform[5];
      }
    }

    fullText += pageText + "\n\n";
  }

  return {
    text: fullText.trim(),
    totalPages: numPages,
  };
}

/**
 * Intelligent NLP & Structure Analyzer that detects Topics, Parent Tasks, and Child Subtasks
 */
export function analyzeDocumentToTasks(
  rawText: string,
  fileName: string,
  totalPages: number
): PdfAnalysisResult {
  const lines = rawText
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  // 1. Determine Topic Name
  let topicName = "";
  const cleanFileName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ");

  // Find a strong header in first 10 lines
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    const line = lines[i];
    // Skip tiny or generic labels
    if (
      line.length >= 4 &&
      line.length <= 70 &&
      !/^(page|table of contents|contents|syllabus|index|copyright|author)/i.test(line) &&
      !/^\d+$/.test(line)
    ) {
      // If it looks like a prominent title
      if (!topicName || line.length > topicName.length) {
        topicName = line;
      }
    }
  }

  if (!topicName || topicName.length < 3) {
    topicName = cleanFileName
      .split(" ")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");
  }

  // 2. Parse Parent Tasks & Subtasks
  const tasks: ParsedTaskItem[] = [];
  let currentTask: ParsedTaskItem | null = null;

  // Patterns indicating parent tasks (Modules, Units, Chapters, Weeks, Main steps)
  const parentPatterns = [
    /^(module|unit|chapter|week|session|phase|part|step|milestone|lesson|section)\s+([0-9ivxlcdm]+|\w+)[:.-]?\s*(.*)/i,
    /^([0-9]{1,2})\.\s+([A-Z0-9].*)/, // 1. Title
    /^([IVXLCDM]{1,6})\.\s+(.*)/, // I. Title
    /^DAY\s+\d+[:.-]?\s*(.*)/i,
  ];

  // Patterns indicating subtasks (Bullets, sub-numbering, letters, dashes)
  const subtaskPatterns = [
    /^[•\-\*–—▪▫►➢]\s*(.*)/,
    /^([0-9]{1,2}\.[0-9]{1,2}(\.[0-9]{1,2})?)\s+([A-Za-z0-9].*)/, // 1.1 or 1.1.1
    /^([a-z]|[A-Z])\)\s*(.*)/, // a) or A)
    /^\([0-9a-zA-Z]\)\s*(.*)/, // (1) or (a)
    /^(\d+\.\d+)\s*(.*)/,
  ];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Filter out page numbers or headers/footers
    if (/^(page\s+\d+(\s+of\s+\d+)?|\d+\s*\/\s*\d+|\d+)$/i.test(line)) {
      continue;
    }
    if (/^(table of contents|contents|course outline|index)$/i.test(line)) {
      continue;
    }

    // Check if line matches a parent task
    let isParent = false;
    let parentTitle = "";

    for (const pattern of parentPatterns) {
      const match = line.match(pattern);
      if (match) {
        isParent = true;
        // Clean title
        parentTitle = line.replace(/^[•\-\*]\s*/, "").trim();
        break;
      }
    }

    // Also check if line is all-caps or title case standalone short header without punctuation
    if (!isParent && line.length >= 5 && line.length <= 60 && !line.endsWith(".")) {
      if (
        (line === line.toUpperCase() && /[A-Z]/.test(line) && !line.includes("HTTP")) ||
        /^[A-Z][a-zA-Z0-9\s,&/-]+$/.test(line)
      ) {
        // Only if it doesn't match a bullet
        if (!subtaskPatterns.some((p) => p.test(line))) {
          isParent = true;
          parentTitle = line;
        }
      }
    }

    if (isParent) {
      // Save previous task if exists
      if (currentTask && currentTask.title) {
        tasks.push(currentTask);
      }

      currentTask = {
        id: `task_${Date.now()}_${tasks.length}_${Math.random().toString(36).substring(2, 7)}`,
        title: cleanTitle(parentTitle),
        priority: tasks.length < 2 ? "high" : tasks.length < 5 ? "medium" : "low",
        subtasks: [],
        selected: true,
      };
      continue;
    }

    // Check if line matches a subtask
    let isSubtask = false;
    let subtaskTitle = "";

    for (const pattern of subtaskPatterns) {
      const match = line.match(pattern);
      if (match) {
        isSubtask = true;
        subtaskTitle = match[match.length - 1] || line;
        break;
      }
    }

    if (isSubtask && subtaskTitle.trim().length > 2) {
      const cleanSub = cleanTitle(subtaskTitle);
      if (currentTask) {
        currentTask.subtasks.push(cleanSub);
      } else {
        // If subtasks appear before first explicit parent, create an initial parent
        currentTask = {
          id: `task_${Date.now()}_0_${Math.random().toString(36).substring(2, 7)}`,
          title: "Introduction & Core Foundations",
          priority: "high",
          subtasks: [cleanSub],
          selected: true,
        };
      }
    } else if (currentTask && line.length >= 8 && line.length <= 120 && !line.includes("©")) {
      // If line is a brief descriptive item or list element under current task
      if (currentTask.subtasks.length < 10 && !currentTask.subtasks.includes(line)) {
        currentTask.subtasks.push(cleanTitle(line));
      }
    }
  }

  // Push final task
  if (currentTask && currentTask.title) {
    tasks.push(currentTask);
  }

  // Fallback if structured parsing produced too few items
  if (tasks.length === 0) {
    // Generate intelligent chunks from paragraphs
    const paragraphs = rawText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    paragraphs.slice(0, 6).forEach((para, idx) => {
      const firstSentence = para.split(/[.!?]/)[0].trim();
      const title = firstSentence.length > 60 ? firstSentence.substring(0, 57) + "..." : firstSentence;
      tasks.push({
        id: `fallback_${idx}`,
        title: title || `Learning Module ${idx + 1}`,
        priority: idx < 2 ? "high" : "medium",
        subtasks: [
          `Review key concepts from section ${idx + 1}`,
          `Practical exercise and notes`,
        ],
        selected: true,
      });
    });
  }

  // Ensure reasonable task count (at least 1, max 20 parent tasks)
  const finalTasks = tasks.slice(0, 20);

  const description = `Imported from "${fileName}" (${totalPages} ${
    totalPages === 1 ? "page" : "pages"
  }) with ${finalTasks.length} milestone modules.`;

  return {
    topicName: cleanTitle(topicName),
    description,
    tasks: finalTasks,
    totalPages,
    rawTextLength: rawText.length,
  };
}

function cleanTitle(str: string): string {
  return str
    .replace(/^\[[\s_xX]?\]\s*/, "")
    .replace(/^[\s•\-\*–—▪▫►➢0-9a-zA-Z\.\)\:\-]+/, (match) => {
      return match.trim() + " ";
    })
    .replace(/^\[[\s_xX]?\]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}
