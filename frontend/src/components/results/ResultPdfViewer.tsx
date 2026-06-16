"use client";

import { useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2, Download } from "lucide-react";

// Worker matched to the installed pdfjs version, served from CDN.
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function ResultPdfViewer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [width, setWidth] = useState(800);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setWidth(Math.min(900, containerRef.current.clientWidth));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  if (failed) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center">
        <p className="text-sm text-gray-400">Couldn't render the PDF in your browser.</p>
        <a href={url} target="_blank" rel="noopener noreferrer"
           className="mt-3 inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500">
          <Download className="h-4 w-4" /> Download PDF
        </a>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      <Document
        file={url}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setFailed(true)}
        loading={<div className="flex justify-center py-20"><Loader2 className="h-7 w-7 animate-spin text-red-500" /></div>}
      >
        {Array.from({ length: numPages }, (_, i) => (
          <div key={i} className="mb-4 overflow-hidden rounded-lg border border-white/10 bg-white">
            <Page pageNumber={i + 1} width={width} renderTextLayer renderAnnotationLayer />
          </div>
        ))}
      </Document>
    </div>
  );
}
