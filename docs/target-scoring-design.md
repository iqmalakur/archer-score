# Target Scoring Design

Status: Implemented and verified automatically. Physical device review remains pending.
Date: 20 November 2026

## Overview

Replace numeric score controls with an interactive target and the existing petung arrow model.
Keep the setup, end navigation, results, and local history workflow.

This is a larger change because input contracts, draft restoration, and stored session data must change together.
Implementation uses the existing `scoring-page` worktree, with the uncommitted arrow preview implementation preserved.
The earlier `codex-dev` handoff is background material. Current chat decisions take precedence.

## Approved scope

- Build the target from overlapping, fully rounded `div` elements.
- Represent one score zone with each circle.
- Activate Setting for ring count, ring scores, and colors.
- Give all rings equal radial width in this version.
- Allow positive ring scores only, with a minimum of 1.
- Remove ring customization from Setup. Keep title, distance, end count, and arrow count.
- Support direct click/tap placement and hold, aim, and release placement.
- Show a visible reticle at the exact future impact point throughout aiming.
- Show a magnifier above the finger, moving below when upper space is insufficient.
- Keep the impact point at the original touch position; magnifier placement never offsets the recorded hit.
- Place the circular target inside a rectangular scoring box that also accepts spatial misses.
- Store coordinates for misses placed outside the circle but inside the scoring box.
- Cancel the gesture when the pointer leaves the scoring box, rather than the circle.
- Show a red cancellation indicator immediately when aiming leaves the box.
- Keep idle unplaced arrows visible at the bottom; lift the active arrow into a ready pose during aiming.
- Reuse the approved petung arrow model, including its tip anchor.
- Preserve `/arrow-preview`, its controls, and its tests for future reuse.
- Restore legacy positive scores without inventing coordinates.
- Convert legacy draft zeros into empty slots that require user review.
- Select arrows only in the Panahmu dock, then show an explicit Cabut action for recorded entries.
- Provide previous and next selection controls for placed arrows, including overlapping arrows.
- Reset only the active end, including misses, and return every arrow in that end to the bottom dock.

The user delegated the choice between a miss status and a numeric zero.
Use an explicit `miss` status. It consumes one arrow and contributes zero to the total.
Determine this status from the placement position and preserve its coordinates.
Zero is not a selectable ring score.

## Approach

### Target and layout

Store rings in center-to-edge order with stable IDs, scores, and colors.
Derive radii from the ring count. A ring's outer radius is its index plus one, divided by the count.
Render the largest circle first and progressively overlay smaller circles at the same center.
Use the same radii for rendering and hit testing. Borders do not change the score zones.

The rectangular scoring box contains the target circle and surrounding space for misses.
Inside the circle, placement records a hit with a positive ring score.
Outside the circle but inside the box, placement records a miss with its actual coordinates.
Outside the box, placement is canceled and consumes no arrow.
Crossing the circle boundary alone never cancels aiming.
Use the same box geometry for input bounds, rendering, and saved positions.

Place end progress, the active arrow number, and subtotal above the target.
Place available petung arrows in a bottom dock with numbered, accessible selection controls.
Used slots show their number, score, and state.
Their physical arrows appear at their recorded positions, including misses in the space surrounding the circle.
Support horizontal scrolling for large arrow counts instead of shrinking touch controls.
Reserve layout space for the dock and account for mobile safe areas.

### Input and correction

Select the first empty slot by default. Allow the user to select another available slot.
Hold inside the scoring box, move to aim, and release to record one hit or spatial miss.
Click or tap any point inside the box to place the active available arrow without waiting for the hold threshold.
Tapping an existing arrow or its recorded point places another available arrow there; it never changes selection.
Hold remains available for precise aiming, including at points already occupied by arrows.
Show a high-contrast reticle at the future impact point throughout valid aiming.
Show the positive ring score inside the circle and a Miss label outside the circle but inside the box.
An uncommitted arrow retains its dock slot throughout the gesture.
During aiming, its model lifts into a larger ready pose above the scoring box's right side.
The tail may extend beyond the viewport edge.
Cancel returns the presentation to its resting state without consuming an arrow.
Leaving the box cancels until that pointer is released, even if it re-enters.

Record the hit or miss at release, then animate the arrow from its ready pose to the recorded point.
Direct taps launch from the same ready position without requiring a hold.
Shrink the flying arrow toward its placed size to show travel away from the camera.
Keep the steady aim orientation throughout flight and after impact, regardless of the recorded position.
The tail stays toward the upper right, including hits at the bullseye and spatial misses.
Bury the metal point and align the visible shaft entry with the recorded point.
Add a short impact vibration along the shaft without rotating it; keep active flights running when selection advances.
Never wait for an animation callback before saving the placement.
Select the next empty slot after a successful placement.

### Cancellation feedback

Immediately outline the scoring box in red when the active aiming pointer moves outside its bounds.
Show a red status message beside the usual score preview: "Bidikan dibatalkan — lepaskan untuk membidik ulang".
Include a cancellation icon so color is not the only indication.
Replace the normal aiming preview with this cancellation state; hide the valid reticle and magnifier.
Keep the red border and message visible until the active pointer is released or canceled.
Re-entering the box during the same gesture does not remove the warning or reactivate aiming.
Release outside the box never records a miss, changes a subtotal, or consumes an arrow.
After release, clear the warning and leave the same arrow available in its dock slot.
The next gesture starts normally. The red state is temporary and is never stored in the draft.
Do not show cancellation styling merely because the pointer leaves the circle while remaining inside the box.
The feedback layer must not intercept pointer input or alter the box bounds.

### Aim assistance

The magnifier shows local rings, the surrounding miss area, placed arrow markers, the reticle, and the score or Miss label.
Use the same target configuration and normalized aiming point as the main board.
Place the magnifier above the contact point with enough separation to remain visible.
Move it below the contact point when there is insufficient space above, and keep it inside the viewport.
Only the magnifier moves when its placement changes. The reticle and recorded point remain at the original touch position.
Do not snap coordinates to ring centers or shift the aim point away from the finger.
The magnifier does not receive pointer events and disappears when aiming finishes or is canceled.
Its final size, separation, and zoom require device testing.

### Arrow selection and removal

Select an arrow through its numbered slot in Panahmu. Dock selection never records a placement.
Highlight the selected arrow and its numbered slot. Display its number, score, and the Cabut action.
Keep selection entirely separate from board input. Placed models and markers are non-interactive.
Use stable arrow IDs for dock selection and rendering; do not perform scene picking.

Provide Sebelumnya and Berikutnya controls inside Panahmu.
Selection follows arrow number within the active end, including placed hits and spatial misses.
Disable the unavailable direction; disable both controls when only one placed arrow exists.
Selection changes highlight and toolbar data only. It never moves coordinates or changes a score.
Do not spread grouped arrows apart to make them selectable.

Cabut changes only the selected hit or miss into an empty entry and updates the subtotal.
Return that physical arrow to its original dock slot and make the slot active for another placement.
Correct a recorded position by removing the arrow and placing it again.
Clear imported legacy entries through their numbered dock controls because they have no physical arrow position.
Record new misses through placement in the box's surrounding area, without a coordinate-free Miss button.
Every slot must contain a hit, miss, or imported legacy score before advancing.

### Resetting the active end

Reset removes every hit, miss, and imported entry in the active end and returns all its arrows to the dock.
Set its subtotal to zero and select the first empty slot.
Preserve other ends, session identity, target settings, the target snapshot, and completed history.
Use the existing Alert dialog before resetting recorded entries.
Canceling that dialog preserves all entries. Reset is unavailable when the active end is already empty.
Finish or cancel any active aim before allowing selection, removal, reset, or end navigation.
Cancel outdated presentation callbacks so removed arrows cannot reappear after an animation finishes.

Use one active pointer and pointer capture. Ignore secondary pointers and non-primary mouse buttons.
Cancel on pointer cancellation, unexpected capture loss, hidden tabs, navigation, and scoring box resizing.
Apply `touch-action: none` only to the scoring box.

### Data and persistence

Use versioned target settings and a versioned draft format.
Snapshot the target and surrounding box geometry when a session starts. Setting changes apply to future sessions.
Preserve unfinished Setup fields when visiting Setting and returning.

Store each slot as one of these states:

| State | Stored meaning | Dock behavior |
| --- | --- | --- |
| `empty` | Not recorded; no score or coordinates | Arrow remains available |
| `hit` | Normalized coordinates, ring ID, and positive score | Arrow appears on the target |
| `miss` | Coordinates inside the box and outside the circle; no ring; contributes zero | Arrow appears at its miss position |
| `legacy` | Imported positive score without coordinates | Slot is filled; no invented target marker |

Keep entries as the editable source of truth. Derive numeric arrays for existing score and result consumers.
Do not maintain independently editable entries and `userScores` arrays.
Store coordinates relative to the target center and radius so layout changes preserve hit positions.
Use the same coordinate system for misses. Their distance from the center can exceed one target radius.
Store the scoring box bounds in that coordinate system as part of the session snapshot.
Scale the circle and box uniformly on resize, preserving the logical box shape and all recorded positions.
Validate hit coordinates against their ring and miss coordinates against the box's area outside the circle.
Also validate colors, dimensions, IDs, and finite numeric values.

Keep target settings separate from the active draft.
Persist placement, Cabut, clearing, miss, and end reset as complete draft updates.
Do not persist pointer movement, magnifier placement, selection, or animation state.
Retain existing storage warnings, retry behavior, and completed-session checks.
Preserve the transaction covering `practices` and `completedSessions`.
Do not increase the Dexie database version solely to add unindexed record fields.

### Compatibility

Recognize the old setup and draft formats before applying new validators.
Resolve the legacy session ID and check completion before transforming the draft.
Convert positive old scores into `legacy` entries and old zeros into `empty` entries.
Explain that converted zero slots need review, including slots in earlier ends.
Build a clearly identified compatibility target from the old score choices without claiming historic geometry.
Do not rewrite completed history or reinterpret its old zero values.
Read both history formats and derive equivalent totals for legacy records.
Show recorded hits and spatial misses in new history using the saved target and box geometry.
Do not create miss coordinates for older records that contain only numeric scores.
Reject damaged new records with recovery feedback instead of silently using global settings.
Write a converted draft only after validation. Preserve the old draft if conversion or writing fails.

### Three.js presentation

Use one transparent canvas for the scoring surface and dock, rather than one renderer per arrow.
Keep DOM controls interactive and accessible; the presentation canvas does not intercept their pointer events.
Do not attach scene picking or selection handlers to the canvas or placed markers.
Use non-interactive position markers when WebGL is unavailable; selection remains in Panahmu.
Map DOM target coordinates into the canvas camera and position the model by its tip anchor.
Place miss arrows using the same mapping. Do not clip their impact points to the target circle.
Create one model per scene and share its geometry and materials across arrow instances.
Dispose shared resources once, after the scene is finished using them.
Use a fixed scoring camera; do not attach the preview's OrbitControls to live scoring.
Render during visual changes and animations rather than keeping an idle animation loop running.

Restore committed arrows after reload without replaying flight animations.
Honor reduced motion by placing arrows immediately.
If WebGL fails, preserve DOM target input, position markers, and Panahmu controls.
The standalone preview keeps its existing WebGL availability message.

## Technology

- Next.js and React: existing pages, client components, state, and lifecycle management.
- Tailwind CSS and scoped styles: circle stacking, responsive layout, safe areas, and focus states.
- Three.js: existing petung geometry, lighting, shared meshes, and arrow presentation.
- Pointer Events and `requestAnimationFrame`: gesture input and short presentation animations.
- localStorage and Dexie: existing preferences, draft, and history storage.
- Existing unit tests and Playwright: domain, persistence, browser interaction, and preview regression checks.

No additional animation library or asset pipeline is planned.

## Key concepts

- Target snapshot: the immutable score rules and appearance associated with one session.
- Normalized placement: a hit or miss position independent of screen pixels and device dimensions.
- Entry state: an explicit distinction between available arrows, hits, misses, and imported scores.
- Presentation: the visual arrow follows committed data and does not determine the recorded score.

## Decisions

Confirmed decisions appear under Approved scope.
The user authorized all checkpoints, including the following design decisions:

- Accept positive safe integer scores and verify that the maximum session total remains a safe integer.
- Retain the existing maximum of 10 rings for this version.
- Preserve existing preset score lists in Setting. Use stable ring IDs independently of their score values.
- Initialize settings from saved legacy score choices when present; otherwise preserve the current 1–6 default.
- Use descending scores from center to edge when converting existing presets.
- Give new targets editable colors from a fixed initial palette.
- Count a boundary point in the inner ring, using a small numerical tolerance.
- Provide clearing for nonspatial entries and completion checks as described above.
- Order previous and next selection by arrow number, and disable controls at either boundary.
- Confirm an active-end reset through the existing Alert dialog.
- Provide keyboard reticle movement and confirmation without restoring the old numeric input form.

Hold timing and animation timing remain prototype values for device testing.
Do not treat values from the previous handoff as approved timing requirements.
Prototype values are a 180 ms hold, 220 ms lift, 420 ms flight, and 180 ms impact settling.
The magnifier remains 128 px with 2.5× zoom.
The logical scoring box extends 1.3 target radii horizontally and 1.15 target radii vertically from its center.

## Verification

The final release check passed 11 unit checks across ten files and all 37 browser tests, plus lint and the production build.
The final keyboard focus refinement also passed its focused browser regression, lint, TypeScript checking, and production build.
The arrow pose refinement passed its unit check, 16 focused browser tests, lint, and TypeScript checking.
Mobile viewport screenshots covered the ready pose, flight, embedded shaft, and consecutive placements.
Pose tests verify matching steady aim and placed orientations across the target and miss area, with unchanged entry points.
Coverage includes native emulated multi-touch, magnifier placement, cancellation, miss restoration, grouped arrows, and twelve-arrow resource lifecycle checks.
Legacy session identity, storage failures, two-tab completion, and version-one history preservation passed their regression checks.
Actual iOS Safari and Android Chrome devices were unavailable. Touch comfort and physical-device rendering performance remain unverified.

## Confirmed assumptions, risks, and open questions

The user confirmed hold-and-release input, equal ring widths, and review of legacy draft zeros.
The user also confirmed the existing petung appearance and asked to retain its preview.
The user confirmed magnifier placement above or below the finger without offsetting the impact point.
The user confirmed that Reset affects only the active end and includes recorded misses.
The user specified spatial misses inside a rectangular scoring box and cancellation only when aiming leaves that box.
The user requested a red indicator when aiming leaves the box.

The user authorized the documented editor limits, initial target, boundary rule, correction controls, and completion rule.
Reading the handoff does not approve its broader settings editor or future features.

Main risks:

- Legacy zeros lose no numeric value, but their meaning is unknown. Requiring review can delay session completion.
- DOM circles and WebGL arrows can drift if they use different measurements. Use one measured coordinate conversion.
- The miss area must preserve its logical shape across layouts. Do not clamp miss coordinates to the target circle.
- Small rings can be difficult to select on phones. Verify touch input and the magnifier on actual devices.
- Multiple arrows increase rendering cost. Share resources and measure the maximum supported arrow count.
- Reset clears the active end's recorded entries. State the scope clearly and use the proposed confirmation dialog.

## Accepted risks

The user accepted converting legacy draft zeros into empty slots that require review.
The user confirmed clearing all recorded entries in the active end through Reset, while preserving other ends.
No device performance or touch accuracy claims have been accepted without testing.

## Out of scope

Variable ring widths, character and bow models, arrow cosmetics, physics, sound, account sync, and bulk history migration.
Undo history, a target library, import/export, and unrelated refactoring are also excluded from this version.
