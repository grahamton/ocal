import {StyleSheet} from 'react-native';

export const styles = StyleSheet.create({
  listContainer: {paddingHorizontal: 16, paddingBottom: 40},
  pairRow: {flexDirection: 'row', gap: 12},
  dayHeading: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
    paddingTop: 8,
    paddingBottom: 10,
  },
  emptyBox: {padding: 32, borderRadius: 16, alignItems: 'center', gap: 12},
  emptyText: {fontSize: 22, fontWeight: '800', textAlign: 'center'},
  emptySubText: {fontSize: 18, textAlign: 'center'},
});
