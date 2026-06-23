import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-Q3KBBWYNR9';
const ADSENSE_CLIENT = 'ca-pub-8909131989940319';

/**
 * Deferred third-party scripts — analytics, ads, affiliates.
 * GA/AdSense load after page idle; dataLayer stub preserves event queueing.
 */
export default function ThirdPartyScripts() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_CONTAINER_ID;
  const goAffProEnabled =
    process.env.NEXT_PUBLIC_GOAFFPRO_ENABLED === 'true' &&
    process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID;

  return (
    <>
      {/* Tiny stub — queues gtag/dataLayer calls before deferred scripts load */}
      <Script id="data-layer-stub" strategy="beforeInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
window.gtag = gtag;`}
      </Script>

      {gtmId ? (
        <Script id="gtm-loader" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      ) : null}

      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics-init" strategy="lazyOnload">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_MEASUREMENT_ID}', {
  page_title: document.title,
  page_location: window.location.href,
  custom_map: {
    'custom_parameter_1': 'resume_builder_opened',
    'custom_parameter_2': 'resume_downloaded',
    'custom_parameter_3': 'job_applied'
  }
});`}
      </Script>

      <Script id="analytics-event-bridge" strategy="lazyOnload">
        {`function trackResumeDownloaded(format) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'resume_downloaded', {
      event_category: 'Resume Builder',
      event_label: 'Resume downloaded in ' + format + ' format',
      value: 1
    });
  }
}
function trackJobApplied(jobId, jobTitle, company) {
  if (typeof gtag !== 'undefined') {
    gtag('event', 'job_applied', {
      event_category: 'Job Application',
      event_label: 'Applied to ' + company + ' - ' + jobTitle,
      job_id: jobId,
      company: company,
      job_title: jobTitle,
      value: 1
    });
  }
}
window.trackResumeDownloaded = trackResumeDownloaded;
window.trackJobApplied = trackJobApplied;`}
      </Script>

      <Script
        id="adsense-loader"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />
      <Script id="adsense-init" strategy="lazyOnload">
        {`(function() {
  function initAdsense() {
    try {
      window.adsbygoogle = window.adsbygoogle || [];
      if (window.adsbygoogle.loaded !== true) {
        window.adsbygoogle.push({});
      }
    } catch (e) {}
  }
  function scheduleInit() {
    if ('requestIdleCallback' in window) {
      requestIdleCallback(initAdsense, { timeout: 3000 });
    } else {
      initAdsense();
    }
  }
  if (document.readyState === 'complete') {
    scheduleInit();
  } else {
    window.addEventListener('load', scheduleInit, { once: true });
  }
})();`}
      </Script>

      {goAffProEnabled ? (
        <Script
          id="goaffpro-loader"
          src={`https://api.goaffpro.com/loader.js?shop=${encodeURIComponent(
            process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID!
          )}`}
          strategy="lazyOnload"
        />
      ) : null}
    </>
  );
}
