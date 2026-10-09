"use client";

/**
 * Renders nothing. The placeholder used to be a black full-height box on an
 * already-black page: invisible, but when the real page replaced it the content
 * landed at a different offset (full-bleed heroes vs padded pages), which
 * Lighthouse scored as a 0.117 layout shift on every route.
 */
export default function Loading() {
  return null;
}
