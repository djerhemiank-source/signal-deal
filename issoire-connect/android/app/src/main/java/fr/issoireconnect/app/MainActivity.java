package fr.issoireconnect.app;

import android.Manifest;
import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.GeolocationPermissions;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String TAG = "IssoireConnect";
    private static final String START_URL = "https://djerhemiank-source.github.io/signal-deal/issoire-connect/app/?platform=android";
    private static final int LOCATION_PERMISSION_REQUEST = 4040;
    private static final int MAX_NETWORK_RETRIES = 3;

    private WebView webView;
    private final Handler retryHandler = new Handler(Looper.getMainLooper());
    private int networkRetryCount = 0;
    private String pendingGeoOrigin;
    private GeolocationPermissions.Callback pendingGeoCallback;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(5, 45, 96));
        getWindow().setNavigationBarColor(Color.rgb(5, 45, 96));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(244, 247, 251));
        applySystemBarInsets(webView);
        configureWebView(webView);
        setContentView(webView);

        if (savedInstanceState == null) webView.loadUrl(START_URL);
        else webView.restoreState(savedInstanceState);
    }

    private void applySystemBarInsets(View view) {
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(), insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            }
            return insets;
        });
    }

    @SuppressWarnings("SetJavaScriptEnabled")
    private void configureWebView(WebView view) {
        WebSettings s = view.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(false);
        s.setGeolocationEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setJavaScriptCanOpenWindowsAutomatically(false);
        s.setSupportMultipleWindows(false);
        s.setMediaPlaybackRequiresUserGesture(true);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setUserAgentString(s.getUserAgentString() + " IssoireConnectAndroid/40");
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.O) {
            s.setSafeBrowsingEnabled(true);
            WebView.startSafeBrowsing(this, null);
        }

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);

        view.setWebViewClient(new IcWebViewClient());
        view.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (!isAllowedIssoireUri(Uri.parse(origin))) {
                    callback.invoke(origin, false, false);
                    return;
                }
                if (hasLocationPermission()) {
                    callback.invoke(origin, true, false);
                    return;
                }
                pendingGeoOrigin = origin;
                pendingGeoCallback = callback;
                requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, LOCATION_PERMISSION_REQUEST);
            }
        });
    }

    private boolean hasLocationPermission() {
        return checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                || checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode != LOCATION_PERMISSION_REQUEST || pendingGeoCallback == null) return;
        boolean granted = hasLocationPermission();
        pendingGeoCallback.invoke(pendingGeoOrigin, granted, false);
        pendingGeoCallback = null;
        pendingGeoOrigin = null;
        if (!granted) Toast.makeText(this, "La localisation reste désactivée. Vous pouvez l’activer plus tard dans les réglages.", Toast.LENGTH_LONG).show();
    }

    private boolean isAllowedIssoireUri(Uri uri) {
        if (uri == null || !"https".equalsIgnoreCase(uri.getScheme())) return false;
        if (!"djerhemiank-source.github.io".equalsIgnoreCase(uri.getHost())) return false;
        String path = uri.getPath();
        return path != null && (path.equals("/signal-deal/issoire-connect") || path.startsWith("/signal-deal/issoire-connect/"));
    }

    private boolean isStripeUri(Uri uri) {
        String h = uri == null ? null : uri.getHost();
        if (h == null) return false;
        h = h.toLowerCase();
        return h.equals("buy.stripe.com") || h.equals("checkout.stripe.com") || h.equals("billing.stripe.com") || h.endsWith(".billing.stripe.com");
    }

    private void openExternal(Uri uri) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
        catch (ActivityNotFoundException e) { Toast.makeText(this, "Aucune application ne peut ouvrir ce lien.", Toast.LENGTH_SHORT).show(); }
    }

    private boolean isTransient(WebResourceError error) {
        if (error == null) return true;
        int c = error.getErrorCode();
        return c == WebViewClient.ERROR_HOST_LOOKUP || c == WebViewClient.ERROR_CONNECT || c == WebViewClient.ERROR_IO || c == WebViewClient.ERROR_TIMEOUT || c == WebViewClient.ERROR_UNKNOWN;
    }

    private void scheduleRetry() {
        if (networkRetryCount >= MAX_NETWORK_RETRIES || webView == null) return;
        networkRetryCount++;
        retryHandler.postDelayed(() -> {
            if (webView != null && !isFinishing() && !isDestroyed()) webView.loadUrl(START_URL);
        }, 1500L * networkRetryCount);
    }

    private final class IcWebViewClient extends WebViewClient {
        @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) { return handle(request.getUrl()); }
        @Override @SuppressWarnings("deprecation") public boolean shouldOverrideUrlLoading(WebView view, String url) { return handle(Uri.parse(url)); }

        private boolean handle(Uri uri) {
            if (uri == null) return true;
            if (isAllowedIssoireUri(uri)) return false;
            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            if (isStripeUri(uri)) {
                Toast.makeText(MainActivity.this, "Ouverture du paiement sécurisé dans votre navigateur.", Toast.LENGTH_SHORT).show();
                openExternal(uri);
                return true;
            }
            if (scheme.equals("http") || scheme.equals("https") || scheme.equals("mailto") || scheme.equals("tel")) openExternal(uri);
            return true;
        }

        @Override public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            networkRetryCount = 0;
            retryHandler.removeCallbacksAndMessages(null);
            Log.i(TAG, "PAGE_READY " + url);
        }

        @Override public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            handler.cancel();
            Toast.makeText(MainActivity.this, "Connexion sécurisée refusée.", Toast.LENGTH_LONG).show();
        }

        @Override public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request != null && request.isForMainFrame() && isTransient(error)) scheduleRetry();
        }
    }

    @Override public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override protected void onDestroy() {
        retryHandler.removeCallbacksAndMessages(null);
        if (webView != null) {
            webView.stopLoading();
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
