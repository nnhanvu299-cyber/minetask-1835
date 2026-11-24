package com.minetask.gamifiedworkflow;

import android.os.Build;
import android.os.Bundle;
import android.view.View;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Vo hieu hoa triet de thanh Autofill (chia khoa, the, vi tri) tren Android Keyboard
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
                }
                if (getWindow() != null && getWindow().getDecorView() != null) {
                    getWindow().getDecorView().setImportantForAutofill(View.IMPORTANT_FOR_AUTOFILL_NO_EXCLUDE_DESCENDANTS);
                }
            } catch (Exception ignored) {
            }
        }
    }
}
