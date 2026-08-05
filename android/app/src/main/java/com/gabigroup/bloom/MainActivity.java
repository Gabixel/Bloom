package com.gabigroup.bloom;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = getBridge().getWebView();
        WebSettings settings = webView.getSettings();

		// https://forum.ionicframework.com/t/android-disable-scroll-bounce-effect/231528
        webView.setOverScrollMode(WebView.OVER_SCROLL_NEVER);

        // https://stackoverflow.com/a/47148988/16804863
        // "viewport" seems to get ignored by default:
        // https://developer.chrome.com/blog/viewport-resize-behavior#:~:text=These%20changes%20do%20not%20affect%20WebView
        settings.setUseWideViewPort(true); // https://developer.android.com/reference/android/webkit/WebSettings#getUseWideViewPort()
        settings.setLoadWithOverviewMode(true);


        settings.setLoadsImagesAutomatically(false);
        settings.setMediaPlaybackRequiresUserGesture(false);
    }
}
