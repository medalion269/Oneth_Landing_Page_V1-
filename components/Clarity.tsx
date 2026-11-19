import Script from "next/script";

/**
 * Microsoft Clarity: heatmaps and session recordings (docs/DECISIONS.md, L27).
 *
 * Loads only when NEXT_PUBLIC_CLARITY_PROJECT_ID is set. Set it in Vercel for Production only, so
 * local runs and preview deployments are never recorded. The value is read at build time, so a
 * change needs a redeploy. The ID is checked before it goes into the inline script.
 */
const projectId = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID?.trim() ?? "";
const validId = /^[a-z0-9]{6,20}$/i.test(projectId);

export default function Clarity() {
  if (!validId) return null;
  return (
    <Script id="ms-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${projectId}");`}
    </Script>
  );
}
