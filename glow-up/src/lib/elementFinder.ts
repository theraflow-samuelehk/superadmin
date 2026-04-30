/**
 * Smart element finder — locates UI elements using multiple strategies.
 * 
 * Strategies:
 *   id:nav-agenda       → data-glowup-id attribute
 *   text:Mario Rossi    → element containing visible text
 *   btn:Salva           → button/[role=button] with text
 *   input:Telefono      → input by placeholder or associated label
 *   css:.my-class       → raw CSS selector
 */

type Strategy = "id" | "text" | "btn" | "input" | "css";
const APPOINTMENT_TARGET_SELECTOR = '[data-glowup-role="appointment-card"], [data-glowup-role="appointment-list-item"]';

export function parseQuery(raw: string): { strategy: Strategy; query: string } {
  const colonIdx = raw.indexOf(":");
  if (colonIdx === -1) return { strategy: "id", query: raw };
  const prefix = raw.slice(0, colonIdx).toLowerCase() as Strategy;
  const query = raw.slice(colonIdx + 1);
  if (["id", "text", "btn", "input", "css"].includes(prefix)) {
    return { strategy: prefix, query };
  }
  return { strategy: "id", query: raw };
}

function getVisibleText(el: Element): string {
  return (el as HTMLElement).innerText || el.textContent || "";
}

function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return false;
  const style = window.getComputedStyle(el as HTMLElement);
  return style.display !== "none" && style.visibility !== "hidden" && style.opacity !== "0";
}

function findFirstVisibleBySelector(selector: string): HTMLElement | null {
  const matches = document.querySelectorAll(selector);
  for (const match of matches) {
    if (isVisible(match)) return match as HTMLElement;
  }
  return null;
}

export function findElement(raw: string): HTMLElement | null {
  const { strategy, query } = parseQuery(raw);
  const normalizedQuery = query.trim().toLowerCase();

  switch (strategy) {
    case "id": {
      return document.querySelector(`[data-glowup-id="${query}"]`) as HTMLElement | null;
    }
    case "text": {
      if (["nome_cliente", "appuntamento", "appointment"].includes(normalizedQuery)) {
        return findFirstVisibleBySelector(APPOINTMENT_TARGET_SELECTOR);
      }

      // Find smallest visible element containing the text
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT);
      let best: HTMLElement | null = null;
      let bestArea = Infinity;
      let node: Node | null;
      while ((node = walker.nextNode())) {
        const el = node as HTMLElement;
        if (!isVisible(el)) continue;
        const t = getVisibleText(el).toLowerCase();
        if (t.includes(query.toLowerCase())) {
          const r = el.getBoundingClientRect();
          const area = r.width * r.height;
          if (area < bestArea && area > 0) {
            best = el;
            bestArea = area;
          }
        }
      }
      return best;
    }
    case "btn": {
      if (["modifica", "edit"].includes(normalizedQuery)) {
        const explicitEditTarget = findFirstVisibleBySelector('[data-glowup-role="appointment-edit"]');
        if (explicitEditTarget) return explicitEditTarget;
      }

      const buttons = document.querySelectorAll("button, [role='button'], a.btn, [type='submit']");
      for (const btn of buttons) {
        if (!isVisible(btn)) continue;
        const t = getVisibleText(btn).toLowerCase();
        if (t.includes(query.toLowerCase())) return btn as HTMLElement;
      }
      // Also check aria-label
      for (const btn of buttons) {
        if (!isVisible(btn)) continue;
        const label = btn.getAttribute("aria-label") || "";
        if (label.toLowerCase().includes(query.toLowerCase())) return btn as HTMLElement;
      }
      return null;
    }
    case "input": {
      // By placeholder
      const inputs = document.querySelectorAll("input, textarea, select");
      for (const inp of inputs) {
        if (!isVisible(inp)) continue;
        const ph = inp.getAttribute("placeholder") || "";
        if (ph.toLowerCase().includes(query.toLowerCase())) return inp as HTMLElement;
      }
      // By associated label
      const labels = document.querySelectorAll("label");
      for (const label of labels) {
        if (getVisibleText(label).toLowerCase().includes(query.toLowerCase())) {
          const forId = label.getAttribute("for");
          if (forId) {
            const inp = document.getElementById(forId);
            if (inp && isVisible(inp)) return inp;
          }
          // Label wrapping input
          const inp = label.querySelector("input, textarea, select") as HTMLElement | null;
          if (inp && isVisible(inp)) return inp;
        }
      }
      return null;
    }
    case "css": {
      return findFirstVisibleBySelector(query);
    }
    default:
      return null;
  }
}
