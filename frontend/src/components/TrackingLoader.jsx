import { useEffect } from "react";
import api from "@/lib/api";

let injected = false;

export default function TrackingLoader() {
  useEffect(() => {
    if (injected) return;
    injected = true;
    api.get("/seo/tracking").then(({ data }) => {
      // Google Analytics 4
      if (data.google_analytics_id) {
        const s1 = document.createElement("script");
        s1.async = true;
        s1.src = `https://www.googletagmanager.com/gtag/js?id=${data.google_analytics_id}`;
        document.head.appendChild(s1);
        const s2 = document.createElement("script");
        s2.innerHTML = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${data.google_analytics_id}');`;
        document.head.appendChild(s2);
      }
      // Facebook Pixel
      if (data.facebook_pixel_id) {
        const s = document.createElement("script");
        s.innerHTML = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init', '${data.facebook_pixel_id}');fbq('track', 'PageView');`;
        document.head.appendChild(s);
      }
      // Google Ads
      if (data.google_ads_id) {
        const s1 = document.createElement("script");
        s1.async = true;
        s1.src = `https://www.googletagmanager.com/gtag/js?id=${data.google_ads_id}`;
        document.head.appendChild(s1);
        const s2 = document.createElement("script");
        s2.innerHTML = `window.dataLayer = window.dataLayer || [];function gtag(){dataLayer.push(arguments);}gtag('js', new Date());gtag('config', '${data.google_ads_id}');`;
        document.head.appendChild(s2);
      }
      // Google Search Console verification — handled by meta in admin settings
      if (data.google_site_verification) {
        const m = document.createElement("meta");
        m.name = "google-site-verification";
        m.content = data.google_site_verification;
        document.head.appendChild(m);
      }
    }).catch(() => {});
  }, []);
  return null;
}
