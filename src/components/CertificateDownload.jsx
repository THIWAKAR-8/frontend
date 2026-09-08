import React from "react";
import { Download, Loader2 } from "lucide-react";

/**
 * Sits at the very end of the page. Presentational only — the
 * actual PDF export (html2canvas + jsPDF) lives in App.jsx, which
 * owns the ref to the certificate content and passes down a click
 * handler + loading state.
 */
export default function CertificateDownload({ onDownload, downloading, certificateId }) {
  return (
    <section className="no-print mt-10 mb-4">
      <div className="data-plate flex flex-wrap items-center justify-between gap-4 px-6 py-5">
        <div>
          <div className="font-mono text-[10px] tracking-[0.08em]" style={{ color: "var(--ink-faint)" }}>
            Reference {certificateId}
          </div>
          <div className="font-display text-lg font-medium" style={{ color: "var(--ink)" }}>
            Save this analysis as a certificate
          </div>
          <div className="text-sm mt-1" style={{ color: "var(--ink-soft)" }}>
            Exports the report above as a PDF, ready to print or attach.
          </div>
        </div>
        <button
          type="button"
          className="download-seal"
          onClick={onDownload}
          disabled={downloading}
        >
          {downloading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Preparing…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Download Certificate
            </>
          )}
        </button>
      </div>
    </section>
  );
}