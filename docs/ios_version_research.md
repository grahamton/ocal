# iOS Version Research

## Goals

**Problem**: Testers need iOS version for testing on iPhones/iPads

- Current release is Android-only (APK)
- React Native app should support iOS with minimal changes
- Need to understand build/distribution process for iOS

**Opportunity**: Expand testing coverage and prepare for App Store release.

## Current State

### Platform Support

- **Built with**: React Native + Expo (cross-platform by design)
- **Tested on**: Android only
- **iOS config**: Bundle identifier exists (`com.grahamton.ocal`)
- **EAS Build**: Configured but no iOS builds yet

### Distribution Challenges

- **TestFlight**: Requires Apple Developer account ($99/year)
- **Ad-hoc**: Limited to 100 devices, requires device UUIDs
- **Simulator**: Only works on macOS

## Options

### Option 1: TestFlight (Recommended for Testing)

**Goal**: Official beta testing platform

**Approach**:

- Enroll in Apple Developer Program ($99/year)
- Build with EAS: `eas build --profile preview --platform ios`
- Upload to TestFlight
- Invite testers via email (no device limits)

**Pros**: Professional, unlimited testers, automatic updates, crash reports
**Cons**: $99/year cost, requires Apple ID

---

### Option 2: Ad-Hoc Distribution

**Goal**: Direct IPA installation without TestFlight

**Approach**:

- Collect device UUIDs from testers
- Build ad-hoc IPA with device list
- Distribute via direct download or services like Diawi

**Pros**: No TestFlight needed, works immediately
**Cons**: 100 device limit, manual UUID collection, expires yearly

---

### Option 3: Expo Go (Development Only)

**Goal**: Quick testing without builds

**Approach**:

- Testers install Expo Go app
- Scan QR code from `expo start`
- App runs in Expo Go sandbox

**Pros**: Instant, no build needed, free
**Cons**: Not a real app (missing native features), requires dev server running

## Recommendation

**Phased Approach**:

1. **Immediate (Free)**: Expo Go for quick validation

   - Verify iOS compatibility
   - Test core features
   - Identify iOS-specific issues

2. **Short-term (Paid)**: TestFlight for real testing

   - Enroll in Apple Developer Program
   - Build production-like IPA
   - Invite Carol & Jim as beta testers

3. **Long-term**: App Store release
   - After beta testing is successful
   - Submit for App Store review
   - Public release

## Action Items

1. **Immediate**: Test with Expo Go to validate iOS compatibility
2. **Next**: Decide if $99/year Apple Developer Program is worth it
3. **Build**: Run `eas build --profile preview --platform ios` when ready
4. **Document**: Add iOS build instructions to repo

## Cost Analysis

- **Apple Developer Program**: $99/year (required for TestFlight + App Store)
- **EAS Build**: Free for open source, or $29/month for unlimited builds
- **Alternative**: Expo Go is free but limited

## Related Work

- Android release (v1.1.0) - iOS should match feature parity
- Desktop Access research - iOS could be primary mobile platform
