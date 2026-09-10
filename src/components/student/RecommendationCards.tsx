import { useMemo, useState } from 'react';
import { type Href, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';

import {
  LearningIcon,
  LearningIconBubble,
  learningIcons,
  learningSymbolName,
  learningToneColor,
  type AppSymbolName,
  type LearningTone,
} from '@/components/student/LearningScaffold';
import { Badge, Button, Card, EmptyState, Progress, studentTokens } from '@/components/student/ui';
import type { AuthUser } from '@/lib/auth';
import { getRecommendations, type Recommendation, type RecommendationContext, type RecommendationPriority, type RecommendationType } from '@/lib/progress-engine';

const fontFamily = 'Quicksand';

type PanelProps = {
  user?: Pick<AuthUser, 'id' | 'plan' | 'goal'>;
  context: RecommendationContext;
  skill?: string;
  limit?: number;
  title?: string;
  eyebrow?: string;
  compact?: boolean;
  dense?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

type ListProps = Omit<PanelProps, 'title' | 'eyebrow' | 'style' | 'contentStyle'> & {
  recommendations?: Recommendation[];
};

const typeIcons: Record<RecommendationType, AppSymbolName> = {
  'watch-lesson': learningIcons.play,
  'focused-practice': learningIcons.target,
  'review-mistakes': learningIcons.refresh,
  'vocabulary-review': learningSymbolName('textformat.abc', 'abc'),
  'grammar-practice': learningIcons.layers,
  'mini-test': learningSymbolName('checklist', 'checklist'),
  'mock-test': learningSymbolName('doc.text.magnifyingglass', 'quiz'),
  'writing-feedback-review': learningIcons.writing,
  'speaking-practice': learningSymbolName('mic', 'mic'),
};

const skillTones: Record<string, LearningTone> = {
  reading: 'blue',
  listening: 'teal',
  speaking: 'purple',
  writing: 'orange',
  vocabulary: 'navy',
  grammar: 'yellow',
  'test-strategy': 'blue',
};

function priorityLabel(priority: RecommendationPriority) {
  if (priority === 'critical') return 'Priority';
  if (priority === 'high') return 'High';
  if (priority === 'medium') return 'Medium';
  return 'Low';
}

function priorityTone(priority: RecommendationPriority) {
  if (priority === 'critical' || priority === 'high') return 'orange' as const;
  if (priority === 'medium') return 'blue' as const;
  return 'default' as const;
}

function recommendationTone(item: Recommendation): LearningTone {
  return skillTones[item.skill] ?? 'blue';
}

export function ProgressRecommendationCard({ item, dense = false }: { item: Recommendation; dense?: boolean }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [expanded, setExpanded] = useState(false);
  const compact = width < 768;
  const tone = recommendationTone(item);
  const isLongReason = item.reason.length > 92;
  const actionHref = item.locked ? '/account/subscription' : item.action.href;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${item.title}. ${item.reason}`}
      onPress={() => router.push(actionHref as Href)}
      style={({ pressed }) => [styles.cardRow, dense ? styles.cardRowDense : null, compact ? styles.cardRowCompact : null, pressed ? styles.pressed : null]}
    >
      <LearningIconBubble icon={typeIcons[item.type]} tone={tone} size={dense ? 36 : 42} />
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, dense ? styles.titleDense : null]} numberOfLines={2}>{item.title}</Text>
          <View style={styles.badgeLine}>
            {item.isPremium ? <Badge label={item.locked ? 'Premium' : 'Unlocked'} tone={item.locked ? 'yellow' : 'teal'} /> : null}
            <Badge label={priorityLabel(item.priority)} tone={priorityTone(item.priority)} />
          </View>
        </View>
        <Text style={[styles.meta, dense ? styles.metaDense : null]} numberOfLines={2}>{item.skillTitle} - {item.subskillTitle} - {item.estimatedMinutes} min</Text>
        <Text style={[styles.reason, dense ? styles.reasonDense : null]} numberOfLines={expanded || !isLongReason ? undefined : 2}>{item.reason}</Text>
        {isLongReason ? (
          <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Hide recommendation reason' : 'Show recommendation reason'} onPress={() => setExpanded((value) => !value)} style={styles.reasonToggle}>
            <Text style={styles.reasonToggleText}>{expanded ? 'Hide reason' : 'Show reason'}</Text>
          </Pressable>
        ) : null}
        {!dense ? <Progress value={item.priorityScore} color={learningToneColor(tone)} /> : null}
      </View>
      {!compact ? (
        <View style={styles.actionColumn}>
          <Text style={[styles.scoreText, { color: learningToneColor(tone) }]}>{Math.round(item.priorityScore)}</Text>
          <Button label={item.locked ? 'View Plan' : item.action.label} size="sm" variant="secondary" style={styles.actionButton} right={<LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={14} />} />
        </View>
      ) : (
        <LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={16} />
      )}
    </Pressable>
  );
}

export function ProgressRecommendationList({ user, context, skill, limit, compact, dense, recommendations }: ListProps) {
  const items = useMemo(
    () => recommendations ?? getRecommendations({ user, context, skill, limit }),
    [context, limit, recommendations, skill, user],
  );

  if (!items.length) {
    return <EmptyState title="No recommendations yet" text="Complete a few lessons or practice sets and the rule-based engine will surface the next action." />;
  }

  return (
    <View style={[styles.list, compact ? styles.listCompact : null]}>
      {items.map((item) => <ProgressRecommendationCard key={item.id} item={item} dense={dense} />)}
    </View>
  );
}

export function ProgressRecommendationPanel({ user, context, skill, limit = 3, title = 'Recommended Next', eyebrow = 'Rule-based', compact, dense, style, contentStyle }: PanelProps) {
  const items = useMemo(() => getRecommendations({ user, context, skill, limit }), [context, limit, skill, user]);

  return (
    <Card title={title} eyebrow={eyebrow} style={[styles.panel, style]} contentStyle={[styles.panelBody, contentStyle]} right={items[0] ? <Badge label={items[0].refreshState === 'fresh' ? 'Fresh' : items[0].refreshState === 'refresh-soon' ? 'Refresh soon' : 'Expired'} tone={items[0].refreshState === 'expired' ? 'danger' : 'blue'} /> : null}>
      <ProgressRecommendationList user={user} context={context} skill={skill} limit={limit} compact={compact} dense={dense} recommendations={items} />
    </Card>
  );
}

const styles = StyleSheet.create({
  panel: { padding: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  panelBody: { padding: 13, gap: 9 },
  list: { gap: 9 },
  listCompact: { gap: 8 },
  pressed: { opacity: 0.76 },
  cardRow: { minHeight: 86, borderRadius: 11, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  cardRowDense: { minHeight: 68, padding: 10, shadowOpacity: 0.02, shadowRadius: 6, shadowOffset: { width: 0, height: 3 } },
  cardRowCompact: { alignItems: 'flex-start' },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' },
  title: { color: studentTokens.ink, fontFamily: 'Quicksand', fontSize: 15, lineHeight: 20, fontWeight: '700', flexShrink: 1 },
  titleDense: { fontFamily: fontFamily, fontSize: 13, lineHeight: 18 },
  badgeLine: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  meta: { color: studentTokens.muted, fontFamily: 'Quicksand', fontSize: 12, lineHeight: 17, fontWeight: '500' },
  metaDense: { fontFamily: fontFamily, fontSize: 10, lineHeight: 14 },
  reason: { color: studentTokens.text, fontFamily: 'Quicksand', fontSize: 13, lineHeight: 19, fontWeight: '500', flexShrink: 1 },
  reasonDense: { fontFamily: fontFamily, fontSize: 10, lineHeight: 15 },
  reasonToggle: { alignSelf: 'flex-start', minHeight: 28, justifyContent: 'center' },
  reasonToggleText: { color: studentTokens.blue, fontFamily: 'Quicksand', fontSize: 11, lineHeight: 15, fontWeight: '700' },
  actionColumn: { width: 128, maxWidth: '34%', alignItems: 'flex-end', gap: 8, flexShrink: 0 },
  actionButton: { width: '100%', borderRadius: 7, minHeight: 34 },
  scoreText: { fontFamily: 'Quicksand', fontSize: 22, lineHeight: 26, fontWeight: '700' },
});

