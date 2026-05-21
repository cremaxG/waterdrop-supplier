package com.watersupplier.widget

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class AppShortcutsBridgeModule(
  reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "AppShortcutsBridge"

  @ReactMethod
  fun updateSummary(vehicles: Double, products: Double, pendingReviews: Double) {
    AppShortcutPublisher.publish(
      reactApplicationContext,
      vehicles.toInt(),
      products.toInt(),
      pendingReviews.toInt(),
    )
  }
}
