package com.watersupplier.widget

import android.content.Context
import android.content.Intent
import android.content.pm.ShortcutInfo
import android.content.pm.ShortcutManager
import android.graphics.drawable.Icon
import android.net.Uri
import android.os.Build
import com.watersupplier.MainActivity
import com.watersupplier.R

object AppShortcutPublisher {
  fun publish(
    context: Context,
    vehicles: Int,
    products: Int,
    pendingReviews: Int,
  ) {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N_MR1) {
      return
    }

    val shortcutManager = context.getSystemService(ShortcutManager::class.java) ?: return
    val maxCount = shortcutManager.maxShortcutCountPerActivity.coerceAtLeast(1)
    val fleetSubtitle =
      if (pendingReviews > 0) {
        "$pendingReviews vehicles waiting for review"
      } else {
        "$vehicles vehicles in your fleet"
      }
    val productsSubtitle =
      if (products > 0) {
        "$products products ready in catalog"
      } else {
        "Open your product catalog"
      }

    val candidates = listOf(
      shortcut(
        context = context,
        id = "add_vehicle",
        shortLabel = "Add Vehicle",
        longLabel = "Register a new fleet vehicle",
        uri = "watersupplier://shortcut/vehicles/add",
        iconRes = R.drawable.ic_shortcut_vehicle,
        rank = 0,
      ),
      shortcut(
        context = context,
        id = "add_product",
        shortLabel = "Add Product",
        longLabel = "Create a new catalog product",
        uri = "watersupplier://shortcut/products/add",
        iconRes = R.drawable.ic_shortcut_product,
        rank = 1,
      ),
      shortcut(
        context = context,
        id = if (pendingReviews > 0) "open_reviews" else "view_orders",
        shortLabel = if (pendingReviews > 0) "Pending Reviews" else "View Orders",
        longLabel =
          if (pendingReviews > 0) {
            "Review supplier feedback and pending vehicles"
          } else {
            "Open supplier order activity"
          },
        uri =
          if (pendingReviews > 0) {
            "watersupplier://shortcut/profile/reviews"
          } else {
            "watersupplier://shortcut/profile/orders"
          },
        iconRes =
          if (pendingReviews > 0) {
            R.drawable.ic_shortcut_reviews
          } else {
            R.drawable.ic_shortcut_orders
          },
        rank = 2,
      ),
      shortcut(
        context = context,
        id = "share_app",
        shortLabel = "Share App",
        longLabel = "Invite suppliers to WaterSupplier",
        uri = "watersupplier://shortcut/share",
        iconRes = R.drawable.ic_shortcut_share,
        rank = 3,
      ),
      shortcut(
        context = context,
        id = "open_fleet",
        shortLabel = "Open Fleet",
        longLabel = fleetSubtitle,
        uri = "watersupplier://shortcut/vehicles",
        iconRes = R.drawable.ic_shortcut_fleet,
        rank = 4,
      ),
      shortcut(
        context = context,
        id = "open_products",
        shortLabel = "Open Products",
        longLabel = productsSubtitle,
        uri = "watersupplier://shortcut/products",
        iconRes = R.drawable.ic_shortcut_product,
        rank = 5,
      ),
    )

    shortcutManager.dynamicShortcuts = candidates.take(maxCount)
  }

  private fun shortcut(
    context: Context,
    id: String,
    shortLabel: String,
    longLabel: String,
    uri: String,
    iconRes: Int,
    rank: Int,
  ): ShortcutInfo {
    val intent =
      Intent(Intent.ACTION_VIEW, Uri.parse(uri), context, MainActivity::class.java).apply {
        addFlags(Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP)
      }

    return ShortcutInfo.Builder(context, id)
      .setShortLabel(shortLabel)
      .setLongLabel(longLabel)
      .setIcon(Icon.createWithResource(context, iconRes))
      .setIntent(intent)
      .setRank(rank)
      .build()
  }
}
