/** Lets any "Apply" or "Join waitlist" link switch the form tab before scrolling to it. */
export type FormMode = "pilot" | "waitlist";

const EVENT = "oneth:form-mode";

export function requestFormMode(mode: FormMode) {
  window.dispatchEvent(new CustomEvent<FormMode>(EVENT, { detail: mode }));
}

export function onFormModeRequest(cb: (mode: FormMode) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<FormMode>).detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}
