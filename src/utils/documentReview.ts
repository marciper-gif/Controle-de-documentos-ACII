/**
 * Helper to check if a document is pending review
 * A document is pending review if it's been more than 365 days since the last review (or emission)
 */
export function getReviewStatus(doc: { emissionDate: string; revisionDate?: string }) {
  const dateStr = doc.revisionDate || doc.emissionDate;
  if (!dateStr) return { isPending: false, daysSinceLastReview: 0, daysOverdue: 0, lastReviewDateStr: '' };

  try {
    const parts = dateStr.split('/');
    if (parts.length !== 3) return { isPending: false, daysSinceLastReview: 0, daysOverdue: 0, lastReviewDateStr: dateStr };

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // 0-indexed month
    const year = parseInt(parts[2], 10);

    const lastReviewDate = new Date(year, month, day);
    // Standardize to midnight for pure day comparison
    lastReviewDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Difference in milliseconds
    const diffTime = today.getTime() - lastReviewDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Revision interval: 1 year (365 days)
    const intervalDays = 365;
    const isPending = diffDays >= intervalDays;
    const daysOverdue = diffDays - intervalDays;

    return {
      isPending,
      daysSinceLastReview: diffDays,
      daysOverdue: isPending ? daysOverdue : 0,
      lastReviewDateStr: dateStr,
      yearsPassed: (diffDays / 365).toFixed(1)
    };
  } catch (e) {
    return { isPending: false, daysSinceLastReview: 0, daysOverdue: 0, lastReviewDateStr: dateStr };
  }
}
