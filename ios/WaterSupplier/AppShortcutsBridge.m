#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>

@interface AppShortcutsBridge : NSObject <RCTBridgeModule>
@end

@implementation AppShortcutsBridge

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXPORT_METHOD(updateSummary:(nonnull NSNumber *)vehicles
                  products:(nonnull NSNumber *)products
                  pendingReviews:(nonnull NSNumber *)pendingReviews)
{
  dispatch_async(dispatch_get_main_queue(), ^{
    NSString *vehicleSubtitle =
      [NSString stringWithFormat:@"%@ vehicles in fleet", vehicles];
    NSString *productSubtitle =
      [NSString stringWithFormat:@"%@ products in catalog", products];
    NSString *reviewSubtitle =
      pendingReviews.integerValue > 0
        ? [NSString stringWithFormat:@"%@ pending reviews", pendingReviews]
        : @"Open supplier orders";
    NSString *fleetSubtitle =
      pendingReviews.integerValue > 0
        ? [NSString stringWithFormat:@"%@ vehicles awaiting review", pendingReviews]
        : @"Review fleet operations";

    UIApplicationShortcutItem *addVehicle =
      [[UIApplicationShortcutItem alloc]
        initWithType:@"com.watersupplier.addVehicle"
        localizedTitle:@"Add Vehicle"
        localizedSubtitle:vehicleSubtitle
        icon:[UIApplicationShortcutIcon iconWithType:UIApplicationShortcutIconTypeAdd]
        userInfo:nil];

    UIApplicationShortcutItem *addProduct =
      [[UIApplicationShortcutItem alloc]
        initWithType:@"com.watersupplier.addProduct"
        localizedTitle:@"Add Product"
        localizedSubtitle:productSubtitle
        icon:[UIApplicationShortcutIcon iconWithType:UIApplicationShortcutIconTypeAdd]
        userInfo:nil];

    UIApplicationShortcutItem *viewOrders =
      [[UIApplicationShortcutItem alloc]
        initWithType:@"com.watersupplier.orders"
        localizedTitle:@"View Orders"
        localizedSubtitle:reviewSubtitle
        icon:[UIApplicationShortcutIcon iconWithType:UIApplicationShortcutIconTypeTask]
        userInfo:nil];

    UIApplicationShortcutItem *openFleet =
      [[UIApplicationShortcutItem alloc]
        initWithType:@"com.watersupplier.fleet"
        localizedTitle:@"Open Fleet"
        localizedSubtitle:fleetSubtitle
        icon:[UIApplicationShortcutIcon iconWithType:UIApplicationShortcutIconTypeHome]
        userInfo:nil];

    [UIApplication sharedApplication].shortcutItems =
      @[addVehicle, addProduct, viewOrders, openFleet];
  });
}

@end
