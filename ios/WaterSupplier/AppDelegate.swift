import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider
import RCTLinkingManager

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    var reactLaunchOptions = launchOptions ?? [:]

    if
      let shortcutItem = launchOptions?[.shortcutItem] as? UIApplicationShortcutItem,
      let shortcutURL = Self.url(for: shortcutItem)
    {
      reactLaunchOptions[.url] = shortcutURL
    }

    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    factory.startReactNative(
      withModuleName: "WaterSupplier",
      in: window,
      launchOptions: reactLaunchOptions
    )

    return true
  }

  func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {
    RCTLinkingManager.application(app, open: url, options: options)
  }

  func application(
    _ application: UIApplication,
    performActionFor shortcutItem: UIApplicationShortcutItem,
    completionHandler: @escaping (Bool) -> Void
  ) {
    guard let shortcutURL = Self.url(for: shortcutItem) else {
      completionHandler(false)
      return
    }

    let handled = RCTLinkingManager.application(
      application,
      open: shortcutURL,
      options: [:]
    )
    completionHandler(handled)
  }

  private static func url(for shortcutItem: UIApplicationShortcutItem) -> URL? {
    switch shortcutItem.type {
    case "com.watersupplier.addVehicle":
      return URL(string: "watersupplier://shortcut/vehicles/add")
    case "com.watersupplier.addProduct":
      return URL(string: "watersupplier://shortcut/products/add")
    case "com.watersupplier.orders":
      return URL(string: "watersupplier://shortcut/profile/orders")
    case "com.watersupplier.fleet":
      return URL(string: "watersupplier://shortcut/vehicles")
    default:
      return nil
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}
