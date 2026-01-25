import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {subscribeToFinds} from '@/shared/firestoreService'; // Updated import
import {useTheme} from '@/shared/ThemeContext';
import {FindRecord} from '@/shared/types';
import {GlassView} from '@/shared/components/GlassView';
import {AnalysisEvent, RockIdResult} from '@/ai/rockIdSchema'; // Added import for AnalysisEvent and RockIdResult

export function InsightsView() {
  const {colors} = useTheme();
  const [finds, setFinds] = useState<FindRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToFinds(
      data => {
        setFinds(data);
        setLoading(false);
        setError(null);
      },
      err => {
        setError('Failed to load insights. You might be offline or an error occurred.');
        setLoading(false);
        console.error(err);
      },
    );

    return () => unsubscribe();
  }, []);

  // Time of day analysis
  const timeAnalysis = () => {
    const hours = finds.map(f => new Date(f.timestamp).getHours());
    const morning = hours.filter(h => h >= 6 && h < 12).length;
    const afternoon = hours.filter(h => h >= 12 && h < 18).length;
    const evening = hours.filter(h => h >= 18 || h < 6).length;
    const total = finds.length || 1;

    return {
      morning: {count: morning, percent: Math.round((morning / total) * 100)},
      afternoon: {
        count: afternoon,
        percent: Math.round((afternoon / total) * 100),
      },
      evening: {count: evening, percent: Math.round((evening / total) * 100)},
    };
  };

  // Rock type distribution
  const rockTypes = () => {
    const types: Record<string, number> = {};
    finds.forEach(f => {
      let aiLabel = 'Unknown';
      if (f.aiData) {
        if ('result' in f.aiData) {
          // It's an AnalysisEvent
          aiLabel = (f.aiData as AnalysisEvent).result?.best_guess?.label || 'Unknown';
        } else {
          // It's a direct RockIdResult (legacy)
          aiLabel = (f.aiData as RockIdResult).best_guess?.label || 'Unknown';
        }
      }

      const type = aiLabel !== 'Unknown' ? aiLabel : f.label || 'Unknown';
      types[type] = (types[type] || 0) + 1;
    });
    return Object.entries(types)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  };

  // Location analysis
  const topLocations = () => {
    const locations: Record<string, number> = {};
    finds.forEach(f => {
      if (f.lat && f.long) {
        // Round to 2 decimals to cluster nearby finds
        const key = `${f.lat.toFixed(2)},${f.long.toFixed(2)}`;
        locations[key] = (locations[key] || 0) + 1;
      }
    });
    return Object.entries(locations)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  };

  const times = timeAnalysis();
  const types = rockTypes();
  const locations = topLocations();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.loading, {color: colors.textSecondary}]}>
          Loading insights...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Ionicons name="warning-outline" size={48} color={colors.danger} />
        <Text style={[styles.empty, {color: colors.textSecondary}]}>
          {error}
        </Text>
      </View>
    );
  }

  if (finds.length === 0) {
    return (
      <View style={[styles.container, styles.emptyContainer]}>
        <Text style={[styles.empty, {color: colors.textSecondary}]}>
          No data yet. Start collecting to see insights!
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Ionicons name="analytics" size={32} color={colors.accent} />
        <Text style={[styles.title, {color: colors.text}]}>Your Insights</Text>
      </View>

      {/* Overview Stats */}
      <GlassView
        style={[styles.card, {backgroundColor: colors.card}]}
        intensity={20}>
        <Text style={[styles.cardTitle, {color: colors.text}]}>Overview</Text>
        <View style={styles.statsRow}>
          <StatItem
            label="Total Finds"
            value={finds.length.toString()}
            icon="albums"
            colors={colors}
          />
          <StatItem
            label="Analyzed"
            value={finds.filter(f => f.aiData).length.toString()}
            icon="sparkles"
            colors={colors}
          />
          <StatItem
            label="Favorites"
            value={finds.filter(f => f.favorite).length.toString()}
            icon="star"
            colors={colors}
          />
        </View>
      </GlassView>

      {/* Time of Day */}
      <GlassView
        style={[styles.card, {backgroundColor: colors.card}]}
        intensity={20}>
        <Text style={[styles.cardTitle, {color: colors.text}]}>
          Best Finding Times
        </Text>
        <TimeBar
          label="Morning (6-12)"
          count={times.morning.count}
          percent={times.morning.percent}
          colors={colors}
        />
        <TimeBar
          label="Afternoon (12-6)"
          count={times.afternoon.count}
          percent={times.afternoon.percent}
          colors={colors}
        />
        <TimeBar
          label="Evening (6-6)"
          count={times.evening.count}
          percent={times.evening.percent}
          colors={colors}
        />
      </GlassView>

      {/* Top Rock Types */}
      <GlassView
        style={[styles.card, {backgroundColor: colors.card}]}
        intensity={20}>
        <Text style={[styles.cardTitle, {color: colors.text}]}>
          Most Common Finds
        </Text>
        {types.map(([type, count], i) => (
          <View key={i} style={styles.listItem}>
            <Text style={[styles.listLabel, {color: colors.text}]}>{type}</Text>
            <Text style={[styles.listValue, {color: colors.textSecondary}]}>
              {count}
            </Text>
          </View>
        ))}
      </GlassView>

      {/* Hot Spots */}
      {locations.length > 0 && (
        <GlassView
          style={[styles.card, {backgroundColor: colors.card}]}
          intensity={20}>
          <Text style={[styles.cardTitle, {color: colors.text}]}>
            Hot Spots
          </Text>
          {locations.map(([_loc, count], i) => (
            <View key={i} style={styles.listItem}>
              <Text style={[styles.listLabel, {color: colors.text}]}>
                Area {i + 1}
              </Text>
              <Text style={[styles.listValue, {color: colors.textSecondary}]}>
                {count} finds
              </Text>
            </View>
          ))}
        </GlassView>
      )}
    </ScrollView>
  );
}

function StatItem({
  label,
  value,
  icon,
  colors,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  colors: Record<string, string>;
}) {
  return (
    <View style={styles.statItem}>
      <Ionicons name={icon} size={24} color={colors.accent} />
      <Text style={[styles.statValue, {color: colors.text}]}>{value}</Text>
      <Text style={[styles.statLabel, {color: colors.textSecondary}]}>
        {label}
      </Text>
    </View>
  );
}

function TimeBar({
  label,
  count,
  percent,
  colors,
}: {
  label: string;
  count: number;
  percent: number;
  colors: Record<string, string>;
}) {
  return (
    <View style={styles.timeBar}>
      <Text style={[styles.timeLabel, {color: colors.text}]}>{label}</Text>
      <View style={styles.barContainer}>
        <View
          style={[
            styles.bar,
            {width: `${percent}%`, backgroundColor: colors.accent},
          ]}
        />
      </View>
      <Text style={[styles.timeValue, {color: colors.textSecondary}]}>
        {count} ({percent}%)
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    gap: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  loading: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    fontStyle: 'italic',
  },
  card: {
    padding: 16,
    borderRadius: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: 'Outfit_700Bold',
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    fontFamily: 'Outfit_800ExtraBold',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  timeBar: {
    gap: 4,
    marginBottom: 8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  barContainer: {
    height: 24,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 12,
  },
  timeValue: {
    fontSize: 12,
    textAlign: 'right',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  listLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  listValue: {
    fontSize: 15,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
});