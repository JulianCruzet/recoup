# Conventions

Recoup helps community centre staff find the benefits a client is likely owed, prepare the forms for the client to
sign, and follow each application until the money arrives.

## Layout

```
app/          routes: / (landing), /clients, /clients/[id], /session, /results, /forms, /tracker, /dashboard, /trust
components/   UI pieces; components/glass for the glass surfaces
lib/types.ts  shared types (Fact, EligibilityResult, ProgramId, FactField)
lib/rules/    one file per program + params/*.json; pure functions, no I/O
lib/ai/       Gemini calls: extract, documents, explain, forms, followup
lib/db/       schema + queries
seed/         personas + synthetic clients
eval/         extraction test transcripts
```

## Rules engine

- Every program is a pure function `(facts) => EligibilityResult`. Same input, same output.
- Every number comes from a parameter file entry `{ value, benefitYear, sourceUrl }`. No magic numbers in code.
- Unknown or unconfirmed facts count as unknown, which makes the result "possible", never "likely".
- Each program has tests with hand-checked amounts, including the edges of every income threshold.

## AI boundaries

- The model extracts facts (each with the quote it came from), reads documents, explains results in plain words,
  and drafts follow-ups. It never decides eligibility and never produces a dollar amount that reaches the screen.
- No SIN anywhere. Synthetic data only. Mock forms are watermarked and never touch government systems.
- Wording is "likely eligible, because...", never "you are eligible".

## Visual brief

- **Audience:** frontline staff sitting with a client; secondarily, the people funding the centre.
- **One job per screen** and one primary action.
- **Look:** glass surfaces (real refraction, not a plain blur) over one rich backdrop; dense forms and tables sit on
  solid panels; mock government forms stay paper white. A strong base with a single accent colour; large,
  high-contrast sans-serif headings.
- **Avoid:** blue-purple gradients, glowing orbs, generic SaaS card grids, the same three-column layout in every
  section, everything floating at once.
- **Motion** only to show hierarchy or respond to input. Respect `prefers-reduced-motion` and
  `prefers-reduced-transparency` (glass falls back to a solid panel).
- **Mobile** gets its own layout, not a shrunk desktop. Check 390, 768, 1024 and 1440 px.
- **Accessibility:** WCAG 2.1 AA contrast, full keyboard path, visible focus, labelled inputs.

## Git

- Branch per task, small commits, plain messages (`add GIS rules + tests`).
- `npm run build` and `npm test` pass before every push.
