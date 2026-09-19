import jsPDF from "jspdf";


/* =========================================
   SAFE TEXT
========================================= */

function safeText(value) {
   if (value === null || value === undefined) {
      return "";
   }

   return String(value);
}


/* =========================================
   SAFE FILE NAME
========================================= */

function createFileName(title, extension) {
   const safeTitle = safeText(title)
      .trim()
      .replace(/[<>:"/\\|?*]+/g, "")
      .replace(/\s+/g, "-")
      .slice(0, 80);

   return `${safeTitle || "gemini-chat"}.${extension}`;
}


/* =========================================
   MARKDOWN TO PLAIN TEXT
   Used for TXT and PDF exports.
========================================= */

function markdownToPlainText(value) {
   let text = safeText(value);

   if (!text) {
      return "";
   }


   /* =====================================
      NORMALIZE LINE BREAKS
   ===================================== */

   text = text.replace(/\r\n/g, "\n");
   text = text.replace(/\r/g, "\n");


   /* =====================================
      REMOVE CODE FENCES

      ```javascript
      const x = 10;
      ```

      becomes:

      const x = 10;
   ===================================== */

   text = text.replace(
      /^```[a-zA-Z0-9_+-]*\s*$/gm,
      ""
   );

   text = text.replace(
      /^```\s*$/gm,
      ""
   );


   /* =====================================
      CONVERT MARKDOWN LINKS

      [Google](https://google.com)

      becomes:

      Google (https://google.com)
   ===================================== */

   text = text.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      "$1 ($2)"
   );


   /* =====================================
      CONVERT IMAGE LINKS

      ![Logo](image.png)

      becomes:

      Logo
   ===================================== */

   text = text.replace(
      /!\[([^\]]*)\]\([^)]+\)/g,
      "$1"
   );


   /* =====================================
      REMOVE HEADING MARKERS

      # Heading
      ## Heading
      ### Heading

      becomes:

      Heading
      Heading
      Heading
   ===================================== */

   text = text.replace(
      /^\s{0,3}#{1,6}\s+/gm,
      ""
   );


   /* =====================================
      REMOVE BLOCKQUOTE MARKERS

      > Some text

      becomes:

      Some text
   ===================================== */

   text = text.replace(
      /^\s*>\s?/gm,
      ""
   );


   /* =====================================
      CONVERT UNORDERED LISTS

      * item
      - item
      + item

      becomes:

      - item
      - item
      - item
   ===================================== */

   text = text.replace(
      /^\s*[*+-]\s+/gm,
      "- "
   );


   /* =====================================
      CLEAN BOLD + ITALIC MARKERS

      ***bold italic***
      ___bold italic___

      **bold**
      __bold__

      *italic*
      _italic_
   ===================================== */

   text = text.replace(
      /\*\*\*(.*?)\*\*\*/g,
      "$1"
   );

   text = text.replace(
      /___(.*?)___/g,
      "$1"
   );

   text = text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
   );

   text = text.replace(
      /__(.*?)__/g,
      "$1"
   );

   text = text.replace(
      /(?<!\w)\*(.*?)\*(?!\w)/g,
      "$1"
   );

   text = text.replace(
      /(?<!\w)_(.*?)_(?!\w)/g,
      "$1"
   );


   /* =====================================
      REMOVE INLINE CODE MARKERS

      `binary search`

      becomes:

      binary search
   ===================================== */

   text = text.replace(
      /`([^`]+)`/g,
      "$1"
   );


   /* =====================================
      REMOVE HORIZONTAL RULES

      ---
      ***
      ___

      Use ASCII for PDF compatibility.
   ===================================== */

   text = text.replace(
      /^\s*(?:-{3,}|\*{3,}|_{3,})\s*$/gm,
      "----------------------------------------"
   );


   /* =====================================
      REMOVE ESCAPED MARKDOWN CHARACTERS

      \*
      \#
      \_
      \`
   ===================================== */

   text = text.replace(
      /\\([\\`*_[\]{}()#+.!>~-])/g,
      "$1"
   );


   /* =====================================
      REMOVE EXCESSIVE SPACES
   ===================================== */

   text = text
      .split("\n")
      .map((line) => line.trimEnd())
      .join("\n");


   /* =====================================
      REMOVE TOO MANY BLANK LINES
   ===================================== */

   text = text.replace(
      /\n{3,}/g,
      "\n\n"
   );


   return text.trim();
}


/* =========================================
   FORMAT CHAT AS PLAIN TEXT
========================================= */

function formatChatText(title, messages = []) {
   const lines = [];


   /* =====================================
      CHAT TITLE
   ===================================== */

   lines.push(
      safeText(title) || "EchoMind"
   );

   lines.push(
      "=".repeat(60)
   );

   lines.push("");


   /* =====================================
      MESSAGES
   ===================================== */

   messages.forEach((item) => {
      const role =
         item.role === "user"
            ? "User"
            : "EchoMind";


      lines.push(role);

      lines.push(
         "-".repeat(60)
      );


      /* ==================================
         MESSAGE
      ================================== */

      const cleanMessage =
         markdownToPlainText(
            item.message
         );


      lines.push(
         cleanMessage || "(No message)"
      );

      lines.push("");


      /* ==================================
         SOURCES
      ================================== */

      if (
         item.role !== "user" &&
         Array.isArray(item.sources) &&
         item.sources.length > 0
      ) {
         lines.push("Sources");

         lines.push(
            "-".repeat(60)
         );


         item.sources.forEach(
            (source, index) => {
               const sourceTitle =
                  safeText(
                     source?.title ||
                     source?.name ||
                     source?.url ||
                     `Source ${index + 1}`
                  );


               lines.push(
                  `${index + 1}. ${sourceTitle}`
               );


               if (source?.url) {
                  lines.push(
                     `   ${source.url}`
                  );
               }


               lines.push("");
            }
         );
      }


      /* ==================================
         FEEDBACK
      ================================== */

      if (
         item.role !== "user" &&
         item.feedback
      ) {
         const feedbackText =
            item.feedback === "positive"
               ? "Positive"
               : "Negative";


         lines.push(
            `Feedback: ${feedbackText}`
         );

         lines.push("");
      }
   });


   return lines.join("\n");
}


/* =========================================
   EXPORT TXT
========================================= */

export function exportChatAsTxt(
   title,
   messages = []
) {
   if (
      !Array.isArray(messages) ||
      messages.length === 0
   ) {
      throw new Error(
         "There are no messages to export."
      );
   }


   const content =
      formatChatText(
         title,
         messages
      );


   const blob = new Blob(
      [content],
      {
         type: "text/plain;charset=utf-8",
      }
   );


   const url =
      URL.createObjectURL(blob);


   const link =
      document.createElement("a");


   link.href = url;


   link.download =
      createFileName(
         title,
         "txt"
      );


   document.body.appendChild(link);

   link.click();

   link.remove();


   URL.revokeObjectURL(url);
}


/* =========================================
   EXPORT MARKDOWN

   Markdown formatting is intentionally
   preserved in this export.
========================================= */

export function exportChatAsMarkdown(
   title,
   messages = []
) {
   if (
      !Array.isArray(messages) ||
      messages.length === 0
   ) {
      throw new Error(
         "There are no messages to export."
      );
   }


   const lines = [];


   /* =====================================
      TITLE
   ===================================== */

   lines.push(
      `# ${safeText(title) || "EchoMind"}`
   );

   lines.push("");

   lines.push("---");

   lines.push("");


   /* =====================================
      MESSAGES
   ===================================== */

   messages.forEach((item) => {
      const role =
         item.role === "user"
            ? "User"
            : "EchoMind";


      lines.push(
         `## ${role}`
      );

      lines.push("");


      /* ==================================
         KEEP ORIGINAL MARKDOWN
      ================================== */

      lines.push(
         safeText(item.message)
      );

      lines.push("");


      /* ==================================
         SOURCES
      ================================== */

      if (
         item.role !== "user" &&
         Array.isArray(item.sources) &&
         item.sources.length > 0
      ) {
         lines.push(
            "### Sources"
         );

         lines.push("");


         item.sources.forEach(
            (source, index) => {
               const sourceTitle =
                  safeText(
                     source?.title ||
                     source?.name ||
                     `Source ${index + 1}`
                  );


               if (source?.url) {
                  lines.push(
                     `${index + 1}. [${sourceTitle}](${source.url})`
                  );
               } else {
                  lines.push(
                     `${index + 1}. ${sourceTitle}`
                  );
               }
            }
         );


         lines.push("");
      }


      /* ==================================
         FEEDBACK
      ================================== */

      if (
         item.role !== "user" &&
         item.feedback
      ) {
         const feedbackText =
            item.feedback === "positive"
               ? "Positive"
               : "Negative";


         lines.push(
            `**Feedback:** ${feedbackText}`
         );

         lines.push("");
      }
   });


   const blob = new Blob(
      [lines.join("\n")],
      {
         type: "text/markdown;charset=utf-8",
      }
   );


   const url =
      URL.createObjectURL(blob);


   const link =
      document.createElement("a");


   link.href = url;


   link.download =
      createFileName(
         title,
         "md"
      );


   document.body.appendChild(link);

   link.click();

   link.remove();


   URL.revokeObjectURL(url);
}


/* =========================================
   EXPORT PDF
========================================= */

export function exportChatAsPdf(
   title,
   messages = []
) {
   if (
      !Array.isArray(messages) ||
      messages.length === 0
   ) {
      throw new Error(
         "There are no messages to export."
      );
   }


   /* =====================================
      CREATE PDF
   ===================================== */

   const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
   });


   const pageWidth =
      pdf.internal.pageSize.getWidth();


   const pageHeight =
      pdf.internal.pageSize.getHeight();


   const margin = 15;


   const usableWidth =
      pageWidth - margin * 2;


   let y = margin;


   /* =====================================
      PAGE CHECK
   ===================================== */

   const addPageIfNeeded = (
      requiredHeight = 8
   ) => {
      if (
         y + requiredHeight >
         pageHeight - margin
      ) {
         pdf.addPage();

         y = margin;
      }
   };


   /* =====================================
      ADD WRAPPED TEXT
   ===================================== */

   const addWrappedText = (
      text,
      fontSize = 10,
      fontStyle = "normal",
      spacingAfter = 2
   ) => {
      const content =
         safeText(text);


      if (!content) {
         return;
      }


      pdf.setFontSize(
         fontSize
      );


      pdf.setFont(
         "helvetica",
         fontStyle
      );


      const wrapped =
         pdf.splitTextToSize(
            content,
            usableWidth
         );


      wrapped.forEach(
         (line) => {
            addPageIfNeeded(7);


            pdf.text(
               line,
               margin,
               y
            );


            y += 5;
         }
      );


      y += spacingAfter;
   };


   /* =====================================
      PDF TITLE
   ===================================== */

   addWrappedText(
      safeText(title) || "EchoMind",
      18,
      "bold",
      4
   );


   /* =====================================
      EXPORT DATE
   ===================================== */

   addWrappedText(
      `Exported: ${new Date().toLocaleString()}`,
      9,
      "normal",
      5
   );


   /* =====================================
      TOP SEPARATOR
   ===================================== */

   addWrappedText(
      "-".repeat(60),
      8,
      "normal",
      5
   );


   /* =====================================
      MESSAGES
   ===================================== */

   messages.forEach(
      (item) => {
         const role =
            item.role === "user"
               ? "User"
               : "EchoMind";


         /* ================================
            MESSAGE ROLE
         ================================= */

         addPageIfNeeded(14);


         addWrappedText(
            role,
            12,
            "bold",
            3
         );


         /* ================================
            CLEAN MESSAGE
         ================================= */

         const cleanMessage =
            markdownToPlainText(
               item.message
            );


         addWrappedText(
            cleanMessage || "(No message)",
            10,
            "normal",
            4
         );


         /* ================================
            SOURCES
         ================================= */

         if (
            item.role !== "user" &&
            Array.isArray(item.sources) &&
            item.sources.length > 0
         ) {
            addPageIfNeeded(12);


            addWrappedText(
               "Sources",
               10,
               "bold",
               2
            );


            item.sources.forEach(
               (source, index) => {
                  const sourceTitle =
                     safeText(
                        source?.title ||
                        source?.name ||
                        source?.url ||
                        `Source ${index + 1}`
                     );


                  addWrappedText(
                     `${index + 1}. ${sourceTitle}`,
                     9,
                     "normal",
                     1
                  );


                  if (source?.url) {
                     addWrappedText(
                        source.url,
                        8,
                        "normal",
                        2
                     );
                  }
               }
            );
         }


         /* ================================
            FEEDBACK
         ================================= */

         if (
            item.role !== "user" &&
            item.feedback
         ) {
            const feedbackText =
               item.feedback === "positive"
                  ? "Positive"
                  : "Negative";


            addWrappedText(
               `Feedback: ${feedbackText}`,
               9,
               "normal",
               3
            );
         }


         /* ================================
            MESSAGE SEPARATOR
         ================================= */

         addPageIfNeeded(8);


         addWrappedText(
            "-".repeat(60),
            7,
            "normal",
            5
         );
      }
   );


   /* =====================================
      SAVE PDF
   ===================================== */

   pdf.save(
      createFileName(
         title,
         "pdf"
      )
   );
}