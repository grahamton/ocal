import {StyleSheet} from 'react-native';

const spacing = 12;

export const styles = StyleSheet.create({
  listContainer: {paddingHorizontal: 16, gap: 12},
  columnWrapper: {justifyContent: 'flex-start', gap: spacing},
  headerContainer: {gap: 12, marginBottom: 12},
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  headerActions: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  viewSwitcher: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    padding: 2,
  },
  viewBtn: {padding: 6, borderRadius: 6},
  sectionHeader: {
    fontSize: 20,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  filterTabs: {flexDirection: 'row', gap: 8, paddingHorizontal: 4},
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterTabText: {fontSize: 14, fontWeight: '700'},
  sessionPickerScroll: {paddingHorizontal: 4, gap: 8, paddingBottom: 4},
  sessionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  sessionChipText: {fontSize: 12, fontWeight: '600'},
  emptyBox: {padding: 32, borderRadius: 16, alignItems: 'center'},
  emptyText: {fontSize: 16, fontStyle: 'italic'},
  emptyCollection: {padding: 32, alignItems: 'center'},
  emptySubText: {fontSize: 14, fontStyle: 'italic'},
});
