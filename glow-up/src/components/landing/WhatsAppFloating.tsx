import { MessageCircle } from "lucide-react";

const PHONE = "393661988644";
const MESSAGE = encodeURIComponent("Ciao! Vorrei avere più informazioni riguardo i vostri servizi.");

export function WhatsAppFloating() {
  return (
    <a
      href={`https://wa.me/${PHONE}?text=${MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contattaci su WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg hover:scale-110 hover:shadow-xl transition-all duration-200"
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7 fill-current">
        <path d="M16.004 0h-.008C7.174 0 0 7.176 0 16c0 3.5 1.128 6.744 3.046 9.378L1.052 31.2l6.012-1.93A15.91 15.91 0 0 0 16.004 32C24.826 32 32 24.822 32 16S24.826 0 16.004 0Zm9.32 22.6c-.39 1.1-1.932 2.012-3.184 2.278-.856.18-1.974.324-5.736-1.232-4.814-1.99-7.912-6.876-8.152-7.194-.23-.318-1.932-2.572-1.932-4.904 0-2.332 1.222-3.476 1.656-3.952.434-.476.948-.596 1.264-.596.316 0 .632.004.908.016.292.014.684-.11 1.07.814.39.94 1.328 3.232 1.444 3.466.118.234.196.508.04.814-.158.318-.236.514-.472.792-.234.278-.494.622-.706.834-.234.234-.478.49-.206.962.274.472 1.216 2.006 2.612 3.252 1.794 1.6 3.306 2.096 3.778 2.33.472.234.748.196 1.022-.118.274-.316 1.178-1.374 1.492-1.848.316-.472.632-.392 1.064-.234.434.156 2.724 1.284 3.192 1.518.466.234.778.352.896.546.116.196.116 1.12-.274 2.22Z" />
      </svg>
    </a>
  );
}
