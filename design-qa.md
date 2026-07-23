# Design QA

## Scope

- Reference: `1-붙여넣은-이미지-1.jpg` (1127 × 264)
- Implementation: `/report` 5점 척도 문항별 양방향 누적 막대
- States checked in source: desktop shared axis, mobile per-row axis, zero-width and narrow-label behavior

## Static comparison

- Question labels are separated into a fixed left column with muted grey chips.
- Every bar uses one continuous `-100% … 0% … +100%` plot.
- The middle of the grey `보통` segment is mathematically anchored to the shared 0% line.
- `매우 불만족` and `조금 불만족` extend left; `조금 만족` and `매우 만족` extend right.
- Segment labels render only when the underlying response share is at least 18%.
- The five requested pastel colors and exact Korean labels are present.
- Mobile switches from the shared desktop line to a centered line inside each chart.

## Automated checks

- `npm run lint`: passed
- `npm run build`: passed
- `node --test tests/rendered-html.test.mjs`: passed

## Visual comparison

The supplied reference was opened and measured. A same-size implementation render
could not be captured because the available in-app browser rejected local preview
navigation under its security policy. No alternate browser surface was used.

final result: blocked
