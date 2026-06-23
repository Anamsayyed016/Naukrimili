import Script from 'next/script';

/**
 * Suppresses noisy Razorpay checkout console errors on payment pages.
 * Runs before interactive so filters are active when checkout scripts load.
 */
export default function RazorpayConsoleFilter() {
  return (
    <Script id="razorpay-console-filter" strategy="beforeInteractive">
      {`(function() {
  if (typeof window === 'undefined') return;
  if (window.__razorpayErrorSuppressionSetup) return;
  window.__razorpayErrorSuppressionSetup = true;
  var originalError = console.error;
  var originalWarn = console.warn;
  var originalLog = console.log;
  var originalInfo = console.info;
  var shouldSuppress = function(message) {
    if (!message) return false;
    if (typeof message !== 'string') {
      try { message = JSON.stringify(message); } catch(e) { message = String(message); }
    }
    var msgLower = message.toLowerCase();
    return (
      msgLower.includes('localhost:7070') ||
      msgLower.includes('localhost:37857') ||
      msgLower.includes('localhost:7071') ||
      (msgLower.includes('cors') && (msgLower.includes('razorpay') || msgLower.includes('localhost'))) ||
      (msgLower.includes('access to image') && msgLower.includes('localhost')) ||
      (msgLower.includes('permission was denied') && msgLower.includes('localhost')) ||
      (msgLower.includes('refused to get unsafe header') && msgLower.includes('x-rtb-fingerprint-id')) ||
      (msgLower.includes('refused to get unsafe header') && msgLower.includes('fingerprint')) ||
      ((msgLower.includes('failed to load resource') || msgLower.includes('net::err_failed') || msgLower.includes('net::err_connection_refused') || msgLower.includes('get http://localhost')) &&
        (msgLower.includes('localhost:7070') || msgLower.includes('localhost:37857') || msgLower.includes('localhost:7071') || msgLower.includes('.png'))) ||
      (msgLower.includes('permissions policy violation') && msgLower.includes('accelerometer')) ||
      (msgLower.includes('permission policy') && msgLower.includes('accelerometer')) ||
      (msgLower.includes('serviceworker') && msgLower.includes('must be a dictionary')) ||
      (msgLower.includes('service worker') && msgLower.includes('dictionary')) ||
      (msgLower.includes('502') && msgLower.includes('razorpay')) ||
      (msgLower.includes('bad gateway') && msgLower.includes('razorpay')) ||
      (msgLower.includes('validate/account') && msgLower.includes('razorpay')) ||
      (msgLower.includes('image') && msgLower.includes('localhost') && (msgLower.includes('7070') || msgLower.includes('37857') || msgLower.includes('7071'))) ||
      (msgLower.includes('failed to launch') && msgLower.includes('paytmmp://')) ||
      (msgLower.includes('v2-entry.modern.js') && (msgLower.includes('fingerprint') || msgLower.includes('localhost')))
    );
  };
  var suppressIfNeeded = function(originalFn, args) {
    try {
      var message = Array.from(args).map(function(arg) {
        if (typeof arg === 'string') return arg;
        if (arg && typeof arg === 'object') {
          try { return JSON.stringify(arg); } catch(e) { return String(arg); }
        }
        return String(arg);
      }).join(' ');
      if (shouldSuppress(message)) return;
      originalFn.apply(console, args);
    } catch(e) {
      originalFn.apply(console, args);
    }
  };
  console.error = function() { suppressIfNeeded(originalError, arguments); };
  console.warn = function() { suppressIfNeeded(originalWarn, arguments); };
  console.log = function() { suppressIfNeeded(originalLog, arguments); };
  console.info = function() { suppressIfNeeded(originalInfo, arguments); };
  window.addEventListener('error', function(event) {
    try {
      var message = (event.message || (event.error && event.error.toString()) || event.filename || (event.target && event.target.src) || '').toLowerCase();
      if (shouldSuppress(message)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    } catch(e) {}
  }, true);
  window.addEventListener('unhandledrejection', function(event) {
    try {
      var message = ((event.reason && event.reason.toString()) || (event.reason && event.reason.message) || String(event.reason) || '').toLowerCase();
      if (shouldSuppress(message)) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }
    } catch(e) {}
  }, true);
})();`}
    </Script>
  );
}
