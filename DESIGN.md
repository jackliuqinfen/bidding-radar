# Design Brief

## Direction

Quiet Ledger — a restrained, dense, Chinese-first enterprise archive tool with an ink-teal sidebar and colour-blind-safe status system.

## Tone

Utilitarian office minimalism: information density and trust over decoration; mobile is a first-class, stacked version of desktop.

## Differentiation

Five-state status vocabulary (待补/待核/已核实/临近到期/已过期) where every state is colour + icon + text, never colour alone.

## Color Palette

| Token      | OKLCH         | Role                                   |
| ---------- | ------------- | -------------------------------------- |
| background | 0.972 0.004 235 | Cool grey page canvas                |
| foreground | 0.22 0.025 245  | Ink text                             |
| card       | 0.998 0.002 235 | White surfaces, tables, forms        |
| primary    | 0.40 0.075 215  | Ink-teal buttons, links, active nav  |
| accent     | 0.93 0.02 210   | Soft teal hover / selected row       |
| muted      | 0.945 0.006 235 | Table headers, zebra, secondary text bg |
| sidebar    | 0.25 0.035 232  | Deep ink-teal desktop navigation     |
| destructive| 0.52 0.19 28    | Delete / reject / reject-approval    |

Status tokens (each has base, `-soft` bg, `-border`, `-foreground` text; Tailwind: `bg-status-missing-soft text-status-missing-foreground border-status-missing-border`):

| Status   | Tailwind key      | Base OKLCH     | Hue family       | Icon (lucide)      |
| -------- | ----------------- | -------------- | ---------------- | ------------------ |
| 待补     | status-missing    | 0.62 0.17 45   | vermillion       | Circle (hollow)    |
| 待核     | status-pending    | 0.55 0.15 255  | blue             | CircleDot / Clock3 |
| 已核实   | status-verified   | 0.58 0.11 165  | bluish green     | CircleCheck        |
| 临近到期 | status-expiring   | 0.80 0.15 88   | yellow           | Hourglass / Clock  |
| 已过期   | status-expired    | 0.50 0.17 350  | reddish purple   | TriangleAlert      |

临近到期/已过期 are additional flags beside the base status (待补/待核/已核实), shown as a second badge.

## Typography

- Display: DM Sans + system CJK (PingFang SC / Microsoft YaHei / Noto Sans CJK SC) — headings, tight tracking, weight 600.
- Body: DM Sans + system CJK — 15px root, tables 13–14px; Geist Mono (`font-mono`) for 证件编号, 版本号, 审计 ID.
- Scale: page title `text-xl md:text-2xl font-semibold`, section h2 `text-base font-semibold`, label `text-xs text-muted-foreground`, body `text-sm`; counts `num-tabular text-2xl font-semibold`.

## Elevation & Depth

Flat layering: background → card with 1px border and `shadow-subtle`; `shadow-elevated` only for popovers, dialogs, sheets.

## Structural Zones

| Zone         | Background                         | Border          | Notes                                              |
| ------------ | ---------------------------------- | --------------- | -------------------------------------------------- |
| Sidebar (lg+) | `bg-sidebar` ink-teal, 240px      | `border-sidebar-border` | Active item `bg-sidebar-accent` + left 2px `sidebar-primary` bar |
| Header       | `bg-card`, h-14                    | `border-b`      | Breadcrumb, search, bell with badge, user menu     |
| Content      | `bg-background`, max-w-7xl, p-4 md:p-6 | —           | Cards on white; table header `bg-muted/60`         |
| Mobile nav   | `bg-card` bottom tab bar (`pb-safe`) | `border-t`    | 5 tabs max, rest in Sheet menu; 44px touch targets |
| Auth / pending pages | `bg-radar-grid` over background | —         | Centered card max-w-sm with logo mark              |

## Spacing & Rhythm

4px base; card padding 16px (20px desktop), grid gap 16px, table rows 40px desktop / stacked label-value cards on mobile.

## Component Patterns

- Buttons: 8px radius, primary solid ink-teal, secondary outline; destructive only for irreversible actions; full-width on mobile forms.
- Cards: `rounded-lg border bg-card shadow-subtle`; company gap cards carry a segmented status bar (5 segments, proportional).
- Badges: 4px radius rectangle (`rounded-sm`), soft bg + border + dark text + 12px icon; expired uses solid-border emphasis, never pill-shaped.
- Tables: dense, sticky muted header, hover `bg-accent/50`; below `md` convert rows to cards.
- Forms: label above input, 40px inputs (44px mobile), inline error text in destructive; expired-version rejection keeps input.
- Sample data always prefixed 【虚构】 in text-foreground, never hidden.

## Motion

- Entrance: `animate-fade-in-up` (250ms) on page content only.
- Hover: `transition-smooth` 200ms on colour/background; no scale effects.
- Decorative: none.

## Constraints

- Colour is never the sole status carrier: icon + Chinese label always visible.
- Only semantic tokens; no raw hex / arbitrary colour classes.
- Light theme only for first batch; `.dark` tokens exist but are not a requirement.
- Do not add UI for bidding workflow, opportunity pool, smart assistance, costs or outbound messaging.

## Signature Detail

Segmented five-state proportion bar on each company card — the 缺口看板 reads at a glance.
