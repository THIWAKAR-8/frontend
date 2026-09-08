import React from "react";

/**
 * Decorative ink-blot backdrop for the certificate.
 *
 * Two dye tones are used on purpose: mulberry (--ink) and kesar/
 * turmeric (--brass) — the same two stains an old-school milk
 * adulteration test would actually leave on paper, so the effect
 * stays tied to the subject instead of being pure decoration.
 *
 * Fixed behind all content, aria-hidden, and completely inert —
 * drop it once near the root of the page, above everything else.
 */
export default function InkBlots() {
  return (
    <div className="ink-backdrop" aria-hidden="true">
      <div className="ink-blot ink-blot--mulberry ink-blot--a" />
      <div className="ink-blot ink-blot--kesar ink-blot--b" />
      <div className="ink-blot ink-blot--mulberry ink-blot--c" />
      <div className="ink-blot ink-blot--kesar ink-blot--d" />

      <svg className="ink-droplets ink-droplets--a" width="90" height="150" viewBox="0 0 90 150">
        <circle cx="45" cy="14" r="8" />
        <circle cx="36" cy="36" r="5" />
        <circle cx="30" cy="52" r="3" />
        <circle cx="26" cy="64" r="1.6" />
      </svg>

      <svg className="ink-droplets ink-droplets--b" width="90" height="150" viewBox="0 0 90 150">
        <circle cx="45" cy="130" r="7" />
        <circle cx="54" cy="108" r="4.5" />
        <circle cx="60" cy="92" r="2.6" />
        <circle cx="64" cy="80" r="1.4" />
      </svg>
    </div>
  );
}