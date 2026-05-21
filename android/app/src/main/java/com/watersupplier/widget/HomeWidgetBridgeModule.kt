package com.watersupplier.widget

import android.content.Context
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class HomeWidgetBridgeModule(
  private val reactContext: ReactApplicationContext,
) : ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String = "HomeWidgetBridge"

  @ReactMethod
  fun updateSummary(vehicles: Double, products: Double, pendingReviews: Double) {
    val preferences =
      reactContext.getSharedPreferences(
        SupplierHomeWidgetProvider.PREFERENCES_NAME,
        Context.MODE_PRIVATE,
      )

    preferences
      .edit()
      .putInt(SupplierHomeWidgetProvider.KEY_VEHICLES, vehicles.toInt())
      .putInt(SupplierHomeWidgetProvider.KEY_PRODUCTS, products.toInt())
      .putInt(SupplierHomeWidgetProvider.KEY_PENDING_REVIEWS, pendingReviews.toInt())
      .apply()

    SupplierHomeWidgetProvider.refreshAll(reactContext)
  }
}
