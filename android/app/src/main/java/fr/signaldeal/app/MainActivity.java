package fr.signaldeal.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.graphics.Color;
import android.net.Uri;
import android.net.http.SslError;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.SslErrorHandler;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import java.io.OutputStream;
import java.nio.charset.StandardCharsets;

public class MainActivity extends Activity {
    private static final String TAG = "SignalDeal";
    private static final String START_URL = "https://djerhemiank-source.github.io/signal-deal/?platform=android-play";
    private static final int CREATE_CSV_REQUEST = 4107;

    private WebView webView;
    private String pendingCsv;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setStatusBarColor(Color.rgb(7, 16, 31));
        getWindow().setNavigationBarColor(Color.rgb(7, 16, 31));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(7, 16, 31));
        applySystemBarInsets(webView);
        configureWebView(webView);
        setContentView(webView);

        if (savedInstanceState == null) {
            webView.loadUrl(START_URL);
        } else {
            webView.restoreState(savedInstanceState);
        }
    }

    private void applySystemBarInsets(View view) {
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
                android.graphics.Insets bars = insets.getInsets(WindowInsets.Type.systemBars());
                v.setPadding(bars.left, bars.top, bars.right, bars.bottom);
            } else {
                v.setPadding(
                    insets.getSystemWindowInsetLeft(),
                    insets.getSystemWindowInsetTop(),
                    insets.getSystemWindowInsetRight(),
                    insets.getSystemWindowInsetBottom()
                );
            }
            return insets;
        });
    }

    @SuppressWarnings("SetJavaScriptEnabled")
    private void configureWebView(WebView view) {
        boolean debuggable = (getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
        if (debuggable) {
            WebView.setWebContentsDebuggingEnabled(true);
        }

        WebSettings settings = view.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(false);
        settings.setGeolocationEnabled(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setJavaScriptCanOpenWindowsAutomatically(false);
        settings.setSupportMultipleWindows(false);
        settings.setMediaPlaybackRequiresUserGesture(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setUserAgentString(settings.getUserAgentString() + " SignalDealAndroidPlay/1.0");
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            settings.setSafeBrowsingEnabled(true);
            WebView.startSafeBrowsing(this, null);
        }

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(view, false);

        view.addJavascriptInterface(new CsvBridge(), "SignalDealAndroid");
        view.setWebChromeClient(new WebChromeClient());
        view.setWebViewClient(new SignalDealWebViewClient());
        view.setDownloadListener((url, userAgent, contentDisposition, mimeType, contentLength) -> {
            if (url != null && url.startsWith("blob:")) {
                Toast.makeText(this, "Utilisez le bouton Export CSV de Signal Deal.", Toast.LENGTH_SHORT).show();
                return;
            }
            openExternal(Uri.parse(url));
        });
    }

    private boolean isAllowedSignalDealUri(Uri uri) {
        if (!"https".equalsIgnoreCase(uri.getScheme())) return false;
        if (!"djerhemiank-source.github.io".equalsIgnoreCase(uri.getHost())) return false;
        String path = uri.getPath();
        return path != null && (path.equals("/signal-deal") || path.startsWith("/signal-deal/"));
    }

    private boolean isStripeHost(Uri uri) {
        String host = uri.getHost();
        if (host == null) return false;
        host = host.toLowerCase();
        return host.equals("buy.stripe.com")
            || host.equals("checkout.stripe.com")
            || host.equals("billing.stripe.com")
            || host.endsWith(".billing.stripe.com");
    }

    private void openExternal(Uri uri) {
        if (uri == null) return;
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (ActivityNotFoundException ignored) {
            Toast.makeText(this, "Aucune application ne peut ouvrir ce lien.", Toast.LENGTH_SHORT).show();
        }
    }

    private final class SignalDealWebViewClient extends WebViewClient {
        @Override
        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
            return handleNavigation(request.getUrl());
        }

        @Override
        @SuppressWarnings("deprecation")
        public boolean shouldOverrideUrlLoading(WebView view, String url) {
            return handleNavigation(Uri.parse(url));
        }

        private boolean handleNavigation(Uri uri) {
            if (uri == null) return true;
            if (isAllowedSignalDealUri(uri)) return false;

            if (isStripeHost(uri)) {
                Log.w(TAG, "Blocked Stripe navigation in Google Play build: " + uri.getHost());
                Toast.makeText(MainActivity.this,
                    "Les achats et la gestion Stripe ne sont pas ouverts depuis la version Google Play.",
                    Toast.LENGTH_LONG).show();
                return true;
            }

            String scheme = uri.getScheme() == null ? "" : uri.getScheme().toLowerCase();
            if (scheme.equals("http") || scheme.equals("https") || scheme.equals("mailto") || scheme.equals("tel")) {
                openExternal(uri);
            }
            return true;
        }

        @Override
        public void onPageFinished(WebView view, String url) {
            super.onPageFinished(view, url);
            Log.i(TAG, "PAGE_FINISHED " + url);
        }

        @Override
        public void onReceivedSslError(WebView view, SslErrorHandler handler, SslError error) {
            Log.e(TAG, "SSL_ERROR " + (error == null ? "unknown" : error.getPrimaryError()));
            handler.cancel();
            Toast.makeText(MainActivity.this, "Connexion sécurisée refusée.", Toast.LENGTH_LONG).show();
        }

        @Override
        public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
            super.onReceivedError(view, request, error);
            if (request.isForMainFrame()) {
                String description = error == null || error.getDescription() == null ? "unknown" : error.getDescription().toString();
                Log.e(TAG, "MAIN_FRAME_ERROR " + description);
                Toast.makeText(MainActivity.this,
                    "Signal Deal est momentanément inaccessible. Vérifiez votre connexion.",
                    Toast.LENGTH_LONG).show();
            }
        }
    }

    private final class CsvBridge {
        @JavascriptInterface
        public void saveCsv(String filename, String csv) {
            if (csv == null) return;
            runOnUiThread(() -> {
                pendingCsv = csv;
                Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
                intent.addCategory(Intent.CATEGORY_OPENABLE);
                intent.setType("text/csv");
                intent.putExtra(Intent.EXTRA_TITLE,
                    (filename == null || filename.trim().isEmpty()) ? "signal-deal-opportunites.csv" : filename);
                try {
                    startActivityForResult(intent, CREATE_CSV_REQUEST);
                } catch (ActivityNotFoundException e) {
                    pendingCsv = null;
                    Toast.makeText(MainActivity.this, "Export CSV indisponible sur cet appareil.", Toast.LENGTH_LONG).show();
                }
            });
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        if (requestCode != CREATE_CSV_REQUEST) return;

        if (resultCode == RESULT_OK && data != null && data.getData() != null && pendingCsv != null) {
            try (OutputStream out = getContentResolver().openOutputStream(data.getData())) {
                if (out == null) throw new IllegalStateException("OutputStream indisponible");
                out.write(pendingCsv.getBytes(StandardCharsets.UTF_8));
                out.flush();
                Toast.makeText(this, "Export CSV enregistré.", Toast.LENGTH_SHORT).show();
            } catch (Exception e) {
                Toast.makeText(this, "Impossible d’enregistrer le CSV.", Toast.LENGTH_LONG).show();
            }
        }
        pendingCsv = null;
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle outState) {
        if (webView != null) webView.saveState(outState);
        super.onSaveInstanceState(outState);
    }

    @Override
    protected void onDestroy() {
        pendingCsv = null;
        if (webView != null) {
            webView.removeJavascriptInterface("SignalDealAndroid");
            webView.stopLoading();
            webView.setWebChromeClient(null);
            webView.setWebViewClient(null);
            webView.destroy();
            webView = null;
        }
        super.onDestroy();
    }
}
