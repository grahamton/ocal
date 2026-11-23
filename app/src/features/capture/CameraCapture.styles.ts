import {StyleSheet} from 'react-native';

export const classes = StyleSheet.create({
  wrapper: {flex: 1},
  // Takes all the space between the header and the shutter bar; the
  // preview inside is sized to the photo's 3:4 shape (what you see is
  // what gets saved).
  previewArea: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  cameraBox: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  camera: {flex: 1},
  hint: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  hintText: {color: '#fff', fontSize: 17, fontWeight: '700'},
  flashOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fff',
    zIndex: 10,
  },
  flyAwayThumbnail: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 9,
  },
  shutterBar: {
    alignItems: 'center',
    marginHorizontal: 0,
    justifyContent: 'center',
    paddingTop: 14,
    paddingBottom: 6,
    gap: 6,
  },
  captureButton: {
    width: 92,
    height: 92,
    borderRadius: 46,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {width: 70, height: 70, borderRadius: 35},
  captureLabel: {fontSize: 18, fontWeight: '800', fontFamily: 'Outfit_700Bold'},
  statusBanner: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
    elevation: 12,
  },
  statusSuccess: {backgroundColor: '#15803d', borderWidth: 2, borderColor: '#4ade80'},
  statusError: {backgroundColor: '#b91c1c', borderWidth: 2, borderColor: '#fca5a5'},
  statusText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'Outfit_800ExtraBold',
    textAlign: 'center',
  },
  permissionContainer: {flex: 1, justifyContent: 'center', padding: 32, gap: 20},
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    textAlign: 'center',
  },
  primaryButton: {
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 100,
    alignItems: 'center',
  },
  primaryButtonText: {color: '#fff', fontSize: 20, fontWeight: '700'},
});
