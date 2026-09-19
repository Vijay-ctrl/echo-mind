import {
   ExternalLink,
   Globe,
} from "lucide-react";

import "./SourceCard.css";


function SourceCard({
   title = "Web Source",
   content = "",
   snippet = "",
   url = "",
   domain = "",
   source_name = "",
   sourceNumber = null,
}) {

   // ==========================================
   // SAFE VALUES
   // ==========================================

   const safeTitle =
      typeof title === "string" && title.trim()
         ? title.trim()
         : "Web Source";


   const safeContent =
      typeof content === "string"
         ? content.trim()
         : "";


   const safeSnippet =
      typeof snippet === "string"
         ? snippet.trim()
         : "";


   const safeUrl =
      typeof url === "string"
         ? url.trim()
         : "";


   const safeDomain =
      typeof domain === "string"
         ? domain.trim()
         : "";


   const safeSourceName =
      typeof source_name === "string" &&
         source_name.trim()
         ? source_name.trim()
         : safeDomain || "Web Source";


   // ==========================================
   // DISPLAY CONTENT
   // ==========================================

   const displayContent =
      safeSnippet || safeContent;


   // ==========================================
   // CHECK WHETHER DOMAIN IS DUPLICATE
   // ==========================================

   const normalizedSourceName =
      safeSourceName
         .toLowerCase()
         .replace(/^www\./, "")
         .trim();


   const normalizedDomain =
      safeDomain
         .toLowerCase()
         .replace(/^www\./, "")
         .trim();


   const showDomain =
      Boolean(safeDomain) &&
      normalizedDomain !== normalizedSourceName;


   // ==========================================
   // VALIDATE SOURCE URL
   // ==========================================

   const isValidUrl = (() => {

      if (!safeUrl) {
         return false;
      }


      try {

         const parsedUrl =
            new URL(safeUrl);


         return (
            parsedUrl.protocol === "http:" ||
            parsedUrl.protocol === "https:"
         );

      } catch {

         return false;

      }

   })();


   // ==========================================
   // SOURCE NUMBER
   // ==========================================

   const hasSourceNumber =
      Number.isInteger(sourceNumber) &&
      sourceNumber > 0;


   // ==========================================
   // RENDER
   // ==========================================

   return (

      <article
         className="source-card"
         aria-label={`Web source: ${safeTitle}`}
      >

         {/* =====================================
             SOURCE NUMBER / ICON
         ===================================== */}

         <div
            className="source-icon"
            aria-hidden="true"
         >

            {hasSourceNumber ? (

               <span className="source-number">
                  {sourceNumber}
               </span>

            ) : (

               <Globe size={17} />

            )}

         </div>


         {/* =====================================
             SOURCE CONTENT
         ===================================== */}

         <div className="source-content">


            {/* =================================
                SOURCE HEADER
            ================================= */}

            <div className="source-header">

               <div className="source-heading">


                  {/* =============================
                      SOURCE NAME
                  ============================= */}

                  <span
                     className="source-name"
                     title={safeSourceName}
                  >
                     {safeSourceName}
                  </span>


                  {/* =============================
                      DOMAIN
                  ============================= */}

                  {showDomain && (

                     <span
                        className="source-domain"
                        title={safeDomain}
                     >
                        {safeDomain}
                     </span>

                  )}

               </div>

            </div>


            {/* =================================
                SOURCE TITLE
            ================================= */}

            <h4
               title={safeTitle}
            >
               {safeTitle}
            </h4>


            {/* =================================
                SOURCE DESCRIPTION
            ================================= */}

            {displayContent && (

               <p>
                  {displayContent}
               </p>

            )}


            {/* =================================
                SOURCE LINK
            ================================= */}

            {isValidUrl && (

               <a
                  href={safeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open source: ${safeTitle}`}
                  title={`Open ${safeTitle}`}
                  className="source-link"
               >

                  <span>
                     Open source
                  </span>


                  <ExternalLink
                     size={14}
                     aria-hidden="true"
                     className="source-link-icon"
                  />

               </a>

            )}

         </div>

      </article>

   );

}


export default SourceCard;