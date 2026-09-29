/** Restore keyboard access after an object closes without leaving its highlight active.
 * Future object dialogs should use this together with the object-back control. */
export function restoreObjectFocus(target:Element|null) {
 if(target instanceof HTMLElement || target instanceof SVGElement) {
  target.focus();
  if(target.classList.contains('cockpit-interactive-fixture')) target.dataset.resting='true';
 }
}
