#import <napi.h>
#import <ApplicationServices/ApplicationServices.h>
#import <AppKit/AppKit.h>

// Helper: get string attribute from an AX element
static NSString *AXGetStringAttribute(AXUIElementRef element, CFStringRef attribute) {
    CFTypeRef value = NULL;
    AXError err = AXUIElementCopyAttributeValue(element, attribute, &value);
    if (err != kAXErrorSuccess || value == NULL) return nil;
    if (CFGetTypeID(value) != CFStringGetTypeID()) {
        CFRelease(value);
        return nil;
    }
    return (__bridge_transfer NSString *)value;
}

// Helper: get children of an AX element
static NSArray<id> *AXGetChildren(AXUIElementRef element) {
    CFTypeRef value = NULL;
    AXError err = AXUIElementCopyAttributeValue(element, kAXChildrenAttribute, &value);
    if (err != kAXErrorSuccess || value == NULL) return @[];
    if (CFGetTypeID(value) != CFArrayGetTypeID()) {
        CFRelease(value);
        return @[];
    }
    return (__bridge_transfer NSArray *)value;
}

// Helper: get role of an AX element
static NSString *AXGetRole(AXUIElementRef element) {
    return AXGetStringAttribute(element, kAXRoleAttribute);
}

// Helper: get description of an AX element
static NSString *AXGetDescription(AXUIElementRef element) {
    return AXGetStringAttribute(element, kAXDescriptionAttribute);
}

// Helper: get value of an AX element
static NSString *AXGetValue(AXUIElementRef element) {
    return AXGetStringAttribute(element, kAXValueAttribute);
}

/**
 * Read the URL bar from a Firefox-based browser window using the Accessibility API.
 *
 * AX tree structure:
 *   AXWindow → AXGroup → AXToolbar(desc="Navigation") → AXGroup → AXComboBox → value
 *
 * When windowTitle is provided and there are multiple windows, we match
 * by checking the description of the first AXGroup child in each window
 * (which corresponds to the page title).
 */
static NSString *ReadFirefoxUrl(pid_t pid, NSString *windowTitle) {
    // Trigger AX trust prompt if not yet granted
    NSDictionary *options = @{(__bridge NSString *)kAXTrustedCheckOptionPrompt: @YES};
    Boolean trusted = AXIsProcessTrustedWithOptions((__bridge CFDictionaryRef)options);
    if (!trusted) {
        fprintf(stderr, "[ax-url-reader] AX not trusted — user needs to grant Accessibility permission\n");
        return nil;
    }

    AXUIElementRef axApp = AXUIElementCreateApplication(pid);
    if (!axApp) return nil;

    CFTypeRef windowsValue = NULL;
    AXError err = AXUIElementCopyAttributeValue(axApp, kAXWindowsAttribute, &windowsValue);

    if (err != kAXErrorSuccess || windowsValue == NULL) return nil;

    NSArray *windows = (__bridge_transfer NSArray *)windowsValue;
    if (windows.count == 0) return nil;

    // Default to first (frontmost) window
    AXUIElementRef window = (__bridge AXUIElementRef)windows[0];

    // If we have a target title, find the matching window by checking the
    // description of the first AXGroup child (which is the page title).
    if (windowTitle && windows.count > 1) {
        for (id winObj in windows) {
            AXUIElementRef candidate = (__bridge AXUIElementRef)winObj;
            NSArray *children = AXGetChildren(candidate);
            for (id childObj in children) {
                AXUIElementRef child = (__bridge AXUIElementRef)childObj;
                NSString *role = AXGetRole(child);
                if ([role isEqualToString:@"AXGroup"]) {
                    NSString *desc = AXGetDescription(child);
                    if (desc && [desc isEqualToString:windowTitle]) {
                        window = candidate;
                    }
                    break; // only check first AXGroup
                }
            }
        }
    }

    // Walk: window → group → toolbar "Navigation" → group → combo box → value
    NSArray *topChildren = AXGetChildren(window);
    AXUIElementRef group1 = NULL;
    for (id childObj in topChildren) {
        AXUIElementRef child = (__bridge AXUIElementRef)childObj;
        if ([AXGetRole(child) isEqualToString:@"AXGroup"]) {
            group1 = child;
            break;
        }
    }
    if (!group1) return nil;

    // Find toolbar with description "Navigation"
    NSArray *group1Children = AXGetChildren(group1);
    AXUIElementRef navToolbar = NULL;
    AXUIElementRef firstToolbar = NULL;
    for (id childObj in group1Children) {
        AXUIElementRef child = (__bridge AXUIElementRef)childObj;
        if ([AXGetRole(child) isEqualToString:@"AXToolbar"]) {
            if (!firstToolbar) firstToolbar = child;
            NSString *desc = AXGetDescription(child);
            if (desc && [desc isEqualToString:@"Navigation"]) {
                navToolbar = child;
                break;
            }
        }
    }
    AXUIElementRef toolbar = navToolbar ? navToolbar : firstToolbar;
    if (!toolbar) return nil;

    // toolbar → group → combo box
    NSArray *tbChildren = AXGetChildren(toolbar);
    AXUIElementRef tbGroup = NULL;
    for (id childObj in tbChildren) {
        AXUIElementRef child = (__bridge AXUIElementRef)childObj;
        if ([AXGetRole(child) isEqualToString:@"AXGroup"]) {
            tbGroup = child;
            break;
        }
    }
    if (!tbGroup) return nil;

    NSArray *tbGroupChildren = AXGetChildren(tbGroup);
    for (id childObj in tbGroupChildren) {
        AXUIElementRef child = (__bridge AXUIElementRef)childObj;
        if ([AXGetRole(child) isEqualToString:@"AXComboBox"]) {
            NSString *value = AXGetValue(child);
            if (value && value.length > 0) {
                return value;
            }
            return nil;
        }
    }

    return nil;
}

/**
 * N-API function: readBrowserUrl(pid: number, windowTitle?: string) → string | null
 */
Napi::Value ReadBrowserUrlNapi(const Napi::CallbackInfo &info) {
    Napi::Env env = info.Env();

    if (info.Length() < 1 || !info[0].IsNumber()) {
        Napi::TypeError::New(env, "Expected pid as first argument (number)")
            .ThrowAsJavaScriptException();
        return env.Null();
    }

    pid_t pid = (pid_t)info[0].As<Napi::Number>().Int32Value();

    NSString *windowTitle = nil;
    if (info.Length() >= 2 && info[1].IsString()) {
        std::string titleStr = info[1].As<Napi::String>().Utf8Value();
        windowTitle = [NSString stringWithUTF8String:titleStr.c_str()];
    }

    @autoreleasepool {
        NSString *url = ReadFirefoxUrl(pid, windowTitle);
        if (url) {
            return Napi::String::New(env, [url UTF8String]);
        }
    }

    return env.Null();
}

Napi::Object Init(Napi::Env env, Napi::Object exports) {
    exports.Set("readBrowserUrl",
                Napi::Function::New(env, ReadBrowserUrlNapi, "readBrowserUrl"));
    return exports;
}

NODE_API_MODULE(ax_url_reader, Init)
