# Target Scoring Implementation Plan

Status: All implementation checkpoints completed. Automated verification passed; physical device review remains pending.
Date: 20 November 2026

## Goal

Replace numeric scoring with configurable DOM circles and the existing Three.js petung arrows.
Keep unplaced arrows in the bottom dock and preserve the standalone arrow preview.
Deliver functional input, local persistence, compatible history, and responsive controls together.

The scope comes from the current chat, including confirmed gestures, equal ring widths, positive ring scores, and legacy zero review.
It includes the confirmed magnifier, exact impact reticle, Cabut action, selection navigation, and active-end Reset.
It also includes spatial misses within the scoring box and red cancellation feedback when aiming leaves that box.
The user authorized the documented design decisions and one complete implementation run.

## Checkpoint 1 — Target and session contracts

### Goal

Establish the data, geometry, validation, and migration behavior without changing the active scoring screen.

### Files

- Create `src/types/target.ts` for target rings, scoring box geometry, and configuration.
- Create `src/types/target-session.ts` for versioned sessions and entry states.
- Create `src/lib/target-geometry.ts` for normalized positions, ring lookup, box bounds, and spatial miss classification.
- Create `src/lib/target-session.ts` for validation, legacy conversion, and numeric score projections.
- Add focused unit tests beside the new library modules.
- Review `src/lib/practice-validation.ts` and `src/lib/practice-session.ts`; preserve the legacy validation and identity path.
- Update the unit test script in `package.json` for the new test files.

### Verification

- Test the center, every boundary, outer edge, and outside points against the configured ring radii.
- Test points outside the circle but inside the box, including corners. Expect misses with preserved coordinates.
- Test points outside the box. Expect cancellation without recording or consuming an arrow.
- Test that no ring accepts zero, negative, fractional, or non-finite scores.
- Test empty, hit, miss, and legacy entries, including invalid dimensions and conflicting hit data.
- Validate miss coordinates against the saved box geometry rather than restricting every position to one target radius.
- Test single-arrow removal and active-end reset. Expect other ends, arrow IDs, and the session snapshot to remain unchanged.
- Test legacy positive scores, zero review, stable session IDs, and completed legacy sessions.
- Run unit tests and lint. Expect existing tests to remain valid before the UI cutover.

## Checkpoint 2 — Setting and target preview

### Goal

Provide a working target editor with reusable DOM circles and independently saved settings.

### Files

- Replace the placeholder in `src/app/setting/page.tsx`.
- Create `src/components/settings/TargetSettings.tsx` for count, score, and color controls.
- Create `src/components/scoring/TargetBoard.tsx` for the scoring box, stacked circles, and optional placement markers.
- Create `src/lib/target-settings.ts` for defaults, validated storage, and preset conversion.
- Update `src/data/nav-item.ts` to expose Setting through the existing navigation component.
- Add `tests/e2e/target-settings.spec.ts` and focused settings storage tests.

### Verification

- Check equal radial ring widths, positive scores, center alignment, and circle shape at mobile and desktop sizes.
- Edit colors and scores, save, reload, and confirm the exact settings return.
- Check that invalid edits cannot be saved and canceled edits do not overwrite saved settings.
- Simulate unavailable storage. Expect an error message rather than a false save confirmation.
- Verify that changing Setting does not mutate an existing session snapshot.

## Checkpoint 3 — Functional scoring and complete data integration

### Goal

Replace the numeric form with usable target input and preserve the complete setup-to-history workflow.
The first review uses DOM hit markers and numbered dock slots before adding Three.js presentation.

### Files

- Replace the numeric form in `src/components/scoring/End.tsx` with the new target controls.
- Create `src/components/scoring/useTargetInteraction.ts` for pointer state and cancellation.
- Create `src/components/scoring/ArrowDock.tsx` for available slots and recorded slot selection.
- Create `src/components/scoring/AimOverlay.tsx` for the reticle, score or Miss preview, magnifier, and red cancellation feedback.
- Add a selected-arrow toolbar to `End.tsx` with Cabut, and keep all selection controls inside `ArrowDock.tsx`.
- Add active-end Reset using the existing `src/components/Alert.tsx` confirmation component.
- Update `src/components/scoring/Main.tsx` for canonical entries, target snapshots, draft commits, restoration, and completion.
- Update `src/components/scoring/Setup.tsx` to remove ring editing and show the active target summary.
- Update `src/types/setup.ts` and `src/types/end-session.ts` while retaining an explicit legacy reader.
- Update `src/lib/db.ts` for compatible record types without weakening completion transactions.
- Adapt `src/components/scoring/Result.tsx`, `src/components/history/HistoryDetail.tsx`, and `HistoryList.tsx` through score projections.
- Display saved hit and miss positions in new history without inventing positions for older numeric records.
- Update `src/lib/score.ts` only if the existing calculation boundary requires adaptation.
- Update `tests/e2e/helpers.ts`, draft fixtures, and existing scoring-dependent browser tests.
- Add `tests/e2e/target-scoring.spec.ts` for input, correction, navigation, and restoration.

### Verification

- Confirm valid hold-release records exactly one hit or spatial miss and advances selection to an empty slot.
- Confirm crossing the circle boundary within the box changes the preview to Miss without canceling the gesture.
- Confirm direct clicks and native touch taps record one hit or spatial miss without requiring a hold.
- Confirm repeated taps at an occupied point place distinct available arrows without selecting recorded arrows.
- Confirm leaving and re-entering the box, a second pointer, and pointer cancellation never consume an arrow.
- Move outside each box edge. Expect an immediate red box border, cancellation icon, and readable cancellation message.
- Confirm the normal reticle and magnifier stop showing a valid placement after cancellation.
- Re-enter the box without releasing. Expect the red warning to remain and the gesture to stay canceled.
- Release after cancellation. Expect unchanged entries, subtotal, and available arrows; clear the warning for the next gesture.
- Confirm miss previews inside the box do not use the red cancellation state.
- Check reticle and magnifier feedback during valid aiming. Expect the same point and positive score or Miss label.
- Aim near the top and bottom edges. Expect the magnifier to remain visible without moving the impact point.
- Check that the magnifier and red feedback cannot capture input or interfere with leaving-box cancellation.
- Select a numbered Panahmu slot. Expect selection and actions without changing entries or recording another hit.
- Navigate overlapping hits and misses with previous and next selection. Expect stable numbering and unchanged coordinates.
- Use Cabut. Expect only that slot to become empty, its score to disappear, and the slot to become active.
- Remove and replace an arrow. Expect one corrected entry with the same slot identity.
- Use Cabut on a spatial miss and clear a legacy entry through its dock control. Expect both slots to become available.
- Confirm a spatial miss consumes a slot, saves its coordinates, and adds no points without creating a zero-valued ring.
- Cancel Reset confirmation. Expect the draft and subtotal to remain unchanged.
- Confirm Reset with mixed hit, miss, and legacy entries. Expect only the active end to become empty.
- Reload after Cabut and Reset. Expect removed entries not to return and other ends to retain their data.
- Reload with recorded misses. Expect their positions to match their saved coordinates and box geometry.
- Check completion gating across all ends, including zeros converted in previous legacy ends.
- Reload after a commit and during aiming. Expect only committed state to return.
- Change Setting during a session. Expect the session and its history to retain their original target.
- Visit Setting from unfinished Setup and return. Expect title, distance, end count, and arrow count to remain intact.
- Verify storage failures retain retry paths and do not delete damaged or unconverted drafts.
- Run the two-tab completion, failed-write, cleanup failure, and version-one history regression tests.
- Confirm result totals, history totals, and maximum scores agree for old and new formats.

## Checkpoint 4 — Petung arrows and placement animation

### Goal

Display available petung arrows at the bottom and move placements to their recorded hit or miss positions within the box.
Lift the active arrow above the box's right side while aiming; allow its tail to extend beyond the viewport.
Launch the larger ready arrow toward the recorded point while shrinking it toward its placed size.
Keep the steady aim orientation during flight and after impact, including the bullseye, diagonal placements, and misses.
Show impact vibration along the shaft without changing its orientation.

### Files

- Create `src/components/scoring/TargetArrowLayer.tsx` for canvas lifecycle and DOM alignment.
- Create `src/components/scoring/target-arrow-scene.ts` for shared arrow resources, lighting, and short animations.
- Integrate the layer with `End.tsx`, `ArrowDock.tsx`, and the measured scoring box and target circle.
- Reuse `src/lib/petung-arrow.ts`; adjust it only if shared resource ownership requires a focused change.
- Keep `src/app/arrow-preview/`, `PetungArrowPreview.tsx`, and `petung-arrow-viewer.ts` available.
- Extend target scoring browser tests and retain `tests/e2e/petung-arrow.spec.ts`.

### Verification

- Check 1 and 12 arrows per end. Expect every unplaced arrow to remain visible or reachable in the bottom dock.
- Confirm a canceled aim leaves the available arrow count unchanged.
- Confirm a held aim lifts the active model from its slot; cancellation returns that model to the dock.
- Check that the metal point disappears on impact while the shaft entry stays at the recorded coordinates.
- Confirm consecutive placements and automatic selection changes preserve active flight animations.
- Check all eight directions, the bullseye, and misses; expect the steady aim orientation and unchanged entry points.
- Check that the ready arrow appears above the box and shrinks during flight, including direct taps.
- Confirm a committed arrow leaves the dock and its tip meets the exact stored target point.
- Place misses around the circle and near box corners. Expect their tips to remain at the actual miss positions.
- Tap a physical arrow while an empty slot is active. Expect placement at that point without changing selection to the old arrow.
- Remove selected arrows and reset an end. Expect the physical arrows to return to their original dock slots.
- Revisit ends, resize the viewport, and reload. Expect no duplicate arrows or position drift.
- Check that grouped hit and miss arrows keep their recorded positions and remain selectable through previous and next controls.
- Interrupt presentation through removal or reset. Expect no late callbacks to recreate removed arrows.
- Enable reduced motion. Expect immediate placement without flight or impact motion.
- Disable or lose WebGL. Expect DOM target input and recorded scores to remain usable.
- Reopen `/arrow-preview`. Expect rotation, detail views, and its existing fallback message to keep working.

## Checkpoint 5 — Accessibility, mobile review, and release checks

### Goal

Verify the complete requested behavior and document actual device findings before considering release.

### Files

- Refine the target, dock, focus states, and local scoring styles only where verification identifies problems.
- Tune magnifier placement, separation, size, and zoom on the supported layouts.
- Extend geometry, migration, target settings, target scoring, and persistence tests where coverage is missing.
- Preserve existing preview, history, and dialog tests.

### Verification

- Check widths 320, 360, 390, and 430 pixels, plus desktop, short screens, landscape, and safe areas.
- Ensure dock controls never obscure the target, active aim feedback, or navigation.
- Complete a session with keyboard controls. Check visible focus and commit announcements.
- Select grouped arrows, use previous and next, remove one, and confirm or cancel Reset using the keyboard.
- Check screen reader labels, custom color contrast, and status information independent of color.
- Verify that cancellation is indicated by a red border, icon, and text rather than color alone.
- Check touch input and finger occlusion on actual iOS Safari and Android Chrome when devices are available.
- Measure rendering with the maximum arrow count. Check idle rendering and resource cleanup across repeated navigation.
- Run `pnpm lint`, `pnpm test:unit`, `pnpm test:e2e`, and `pnpm build` on the final change.
- Record unavailable device checks explicitly. Browser emulation does not prove real-device comfort or performance.

## Completion criteria

The numeric score form is replaced, Setting works, and Setup retains arrow count without ring customization.
Positive ring scores, explicit misses, and unplaced arrows remain distinct throughout the session lifecycle.
Idle unplaced arrows stay in the bottom dock; the active arrow temporarily lifts into a ready pose during aiming.
The aiming reticle, magnifier, and committed arrow tip identify the same point.
Misses keep their coordinates outside the circle and inside the box, without adding points or introducing zero-valued rings.
Leaving the box displays red cancellation feedback, records no placement, and leaves the arrow available in its dock slot.
Cabut returns one arrow to its dock slot; Reset clears only the active end, including misses.
Grouped arrows remain individually selectable without changing their recorded positions.
Drafts restore safely, legacy history remains readable, and completed sessions cannot be saved twice.
The petung model is reused, the original preview remains available, and required regression checks pass.

## Verification results

- Checkpoint 1: geometry, entry validation, legacy conversion, and session identity checks passed.
- Checkpoint 2: target editing, positive score validation, saved settings, and storage error checks passed.
- Checkpoint 3: hit/miss placement, box cancellation, Cabut, Reset, selection, draft restoration, results, and history checks passed.
- Checkpoint 4: petung arrows, reduced motion, WebGL fallback, preview preservation, idle rendering, and shared resource cleanup checks passed.
- Checkpoint 5: responsive layouts, native emulated multi-touch, keyboard operation, focus, and visual screenshot review passed.
- Final release checks passed lint, 11 unit checks across ten files, and all 37 browser tests.
- The production build passed through the browser test server startup.
- The final keyboard focus refinement passed its focused browser regression, lint, TypeScript checking, and production build.
- The arrow pose refinement passed its unit check, 16 focused browser tests, lint, and TypeScript checking.
- Mobile viewport screenshots covered the ready pose, flight, embedded shaft, and consecutive placements.

Physical iOS Safari and Android Chrome devices were unavailable.
Real-device touch comfort and rendering performance remain unverified; browser emulation is not a substitute for those checks.

## Implementation notes

Existing setup and end-session types remain dedicated to legacy readers; new contracts use target-specific types.
Completed records retain numeric score projections for existing result consumers. Editable session state uses entries only.
Layout styles are split between shared scoring controls and target presentation.
No additional dependency was required beyond the Three.js dependency already added for the approved arrow preview.
