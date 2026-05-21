package com.watersupplier.widget

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.RemoteViews
import com.watersupplier.MainActivity
import com.watersupplier.R

class SupplierHomeWidgetProvider : AppWidgetProvider() {

  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    appWidgetIds.forEach { appWidgetId ->
      updateWidget(context, appWidgetManager, appWidgetId)
    }
  }

  companion object {
    const val PREFERENCES_NAME = "supplier_home_widget"
    const val KEY_VEHICLES = "vehicles"
    const val KEY_PRODUCTS = "products"
    const val KEY_PENDING_REVIEWS = "pending_reviews"

    fun refreshAll(context: Context) {
      val widgetManager = AppWidgetManager.getInstance(context)
      val widgetIds = widgetManager.getAppWidgetIds(
        ComponentName(context, SupplierHomeWidgetProvider::class.java),
      )

      if (widgetIds.isEmpty()) {
        return
      }

      widgetIds.forEach { widgetId ->
        updateWidget(context, widgetManager, widgetId)
      }
    }

    private fun updateWidget(
      context: Context,
      appWidgetManager: AppWidgetManager,
      appWidgetId: Int,
    ) {
      val preferences = context.getSharedPreferences(PREFERENCES_NAME, Context.MODE_PRIVATE)
      val vehicles = preferences.getInt(KEY_VEHICLES, 0)
      val products = preferences.getInt(KEY_PRODUCTS, 0)
      val pendingReviews = preferences.getInt(KEY_PENDING_REVIEWS, 0)
      val remoteViews = RemoteViews(context.packageName, R.layout.supplier_hub_widget)

      remoteViews.setTextViewText(
        R.id.widgetSubtitle,
        context.getString(
          R.string.widget_subtitle_dynamic,
          vehicles,
          products,
          pendingReviews,
        ),
      )
      remoteViews.setTextViewText(R.id.widgetVehicleValue, vehicles.toString())
      remoteViews.setTextViewText(R.id.widgetProductValue, products.toString())
      remoteViews.setTextViewText(R.id.widgetPendingValue, pendingReviews.toString())

      remoteViews.setOnClickPendingIntent(
        R.id.widgetVehicleCard,
        createLaunchPendingIntent(context, "watersupplier://widget/vehicles"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetProductCard,
        createLaunchPendingIntent(context, "watersupplier://widget/products"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetPendingCard,
        createLaunchPendingIntent(context, "watersupplier://widget/profile/reviews"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetRoot,
        createLaunchPendingIntent(context, "watersupplier://widget/dashboard"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetAddVehicleButton,
        createLaunchPendingIntent(context, "watersupplier://widget/vehicles/add"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetAddProductButton,
        createLaunchPendingIntent(context, "watersupplier://widget/products/add"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetOrdersButton,
        createLaunchPendingIntent(context, "watersupplier://widget/profile/orders"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetProductsButton,
        createLaunchPendingIntent(context, "watersupplier://widget/products"),
      )
      remoteViews.setOnClickPendingIntent(
        R.id.widgetFleetButton,
        createLaunchPendingIntent(context, "watersupplier://widget/vehicles"),
      )

      appWidgetManager.updateAppWidget(appWidgetId, remoteViews)
    }

    private fun createLaunchPendingIntent(context: Context, uri: String): PendingIntent {
      val intent = Intent(Intent.ACTION_VIEW, Uri.parse(uri), context, MainActivity::class.java)
        .apply {
          addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }

      return PendingIntent.getActivity(
        context,
        uri.hashCode(),
        intent,
        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE,
      )
    }
  }
}
