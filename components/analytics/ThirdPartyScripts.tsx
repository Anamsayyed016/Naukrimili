import Script from 'next/script';

const GA_MEASUREMENT_ID = 'G-Q3KBBWYNR9';
const ADSENSE_CLIENT = 'ca-pub-8909131989940319';
const META_PIXEL_ID = '1035238572315429';

/**
 * Deferred third-party scripts — analytics, ads, affiliates.
 * GA/AdSense/Meta Pixel load after page idle; dataLayer stub preserves event queueing.
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

      {/* Auto ads: client on script src is sufficient — do not call adsbygoogle.push({}) */}
      <Script
        id="adsense-loader"
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
        strategy="lazyOnload"
        crossOrigin="anonymous"
      />

      {goAffProEnabled ? (
        <Script
          id="goaffpro-loader"
          src={`https://api.goaffpro.com/loader.js?shop=${encodeURIComponent(
            process.env.NEXT_PUBLIC_GOAFFPRO_SHOP_ID!
          )}`}
          strategy="lazyOnload"
        />
      ) : null}

      <Script id="meta-pixel-init" strategy="lazyOnload">
        {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${META_PIXEL_ID}');
fbq('track', 'PageView');`}
      </Script>
    </>
  );
}
