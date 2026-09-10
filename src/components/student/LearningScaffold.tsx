import type React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions, type DimensionValue } from 'react-native';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';

import { Card, Progress, studentTokens } from '@/components/student/ui';

export type LearningTone = 'blue' | 'teal' | 'orange' | 'purple' | 'yellow' | 'navy' | 'green';
export type AppSymbolName = { ios: SFSymbol; android: AndroidSymbol; web: AndroidSymbol };

const fontFamily = 'Quicksand';

export const learningSymbolName = (ios: string, web: string): AppSymbolName => ({
  ios: ios as SFSymbol,
  android: web as AndroidSymbol,
  web: web as AndroidSymbol,
});

export const learningIcons = {
  book: learningSymbolName('book', 'menu_book'),
  target: learningSymbolName('target', 'track_changes'),
  check: learningSymbolName('checkmark', 'check'),
  refresh: learningSymbolName('arrow.clockwise', 'refresh'),
  star: learningSymbolName('star.fill', 'star'),
  clock: learningSymbolName('clock', 'schedule'),
  bolt: learningSymbolName('bolt.fill', 'bolt'),
  play: learningSymbolName('play.fill', 'play_arrow'),
  arrow: learningSymbolName('chevron.right', 'chevron_right'),
  lock: learningSymbolName('lock.fill', 'lock'),
  layers: learningSymbolName('square.stack.3d.up', 'layers'),
  edit: learningSymbolName('square.and.pencil', 'edit_square'),
  article: learningSymbolName('text.book.closed', 'article'),
  link: learningSymbolName('link', 'link'),
  person: learningSymbolName('person', 'person'),
  writing: learningSymbolName('pencil.line', 'edit_note'),
  structure: learningSymbolName('list.bullet.indent', 'account_tree'),
  academic: learningSymbolName('graduationcap', 'school'),
};

export function learningToneColor(tone: LearningTone) {
  const colors: Record<LearningTone, string> = {
    blue: studentTokens.blue,
    teal: studentTokens.teal,
    orange: studentTokens.orange,
    purple: '#8b5cf6',
    yellow: studentTokens.yellowDeep,
    navy: '#001b48',
    green: '#16a34a',
  };
  return colors[tone];
}

export function learningToneSoft(tone: LearningTone) {
  const colors: Record<LearningTone, string> = {
    blue: studentTokens.blueSoft,
    teal: studentTokens.tealSoft,
    orange: studentTokens.orangeSoft,
    purple: '#f0e9ff',
    yellow: studentTokens.yellowSoft,
    navy: '#edf2ff',
    green: '#e8f8ef',
  };
  return colors[tone];
}

export function LearningIcon({ name, color = studentTokens.navy, size = 20 }: { name: AppSymbolName; color?: string; size?: number }) {
  return <SymbolView name={name} tintColor={color} size={size} style={{ width: size, height: size }} />;
}

export function LearningIconBubble({ icon, tone = 'blue', size = 46 }: { icon: AppSymbolName; tone?: LearningTone; size?: number }) {
  const iconSize = Math.round(size * 0.48);
  return (
    <View style={[styles.iconBubble, { width: size, height: size, borderRadius: Math.round(size / 3), backgroundColor: learningToneSoft(tone) }]}>
      <LearningIcon name={icon} color={learningToneColor(tone)} size={iconSize} />
    </View>
  );
}

export function LearningPageHeader({ eyebrow, title, subtitle, right }: { eyebrow?: string; title: string; subtitle: string; right?: React.ReactNode }) {
  return (
    <View style={styles.pageHeader}>
      <View style={styles.headerCopy}>
        {eyebrow ? <Text style={styles.kicker}>{eyebrow}</Text> : null}
        <Text style={styles.pageTitle}>{title}</Text>
        <Text style={styles.pageSubtitle}>{subtitle}</Text>
      </View>
      {right ? <View style={styles.headerActions}>{right}</View> : null}
    </View>
  );
}

export type LearningMetric = {
  label: string;
  value: string;
  note: string;
  icon: AppSymbolName;
  tone: LearningTone;
  progress: number;
  max?: number;
};

function LearningMetricCard({ metric, width }: { metric: LearningMetric; width?: DimensionValue }) {
  return (
    <Card style={[styles.metricCard, { width }]} contentStyle={styles.metricBody}>
      <View style={styles.metricTop}>
        <LearningIconBubble icon={metric.icon} tone={metric.tone} />
        <View style={styles.metricCopy}>
          <Text style={styles.metricLabel}>{metric.label}</Text>
          <Text style={styles.metricValue}>{metric.value}</Text>
          <Text style={styles.metricNote}>{metric.note}</Text>
        </View>
      </View>
      <Progress value={metric.progress} max={metric.max ?? 100} color={learningToneColor(metric.tone)} style={styles.metricProgress} />
    </Card>
  );
}

export function LearningMetricGrid({ metrics }: { metrics: LearningMetric[] }) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1100;
  const cardWidth = isMobile ? '100%' : isTablet ? '48%' : undefined;

  return (
    <View style={styles.metricGrid}>
      {metrics.map((metric) => <LearningMetricCard key={metric.label} metric={metric} width={cardWidth} />)}
    </View>
  );
}

export function LearningActionCard({
  title,
  text,
  icon,
  tone,
  badge,
  disabled,
  onPress,
}: {
  title: string;
  text: string;
  icon: AppSymbolName;
  tone: LearningTone;
  badge?: React.ReactNode;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.actionCard, pressed ? styles.pressed : null, disabled ? styles.disabled : null]}
    >
      <LearningIconBubble icon={icon} tone={tone} />
      <View style={styles.actionCopy}>
        <View style={styles.actionTitleRow}>
          <Text style={styles.actionTitle}>{title}</Text>
          {badge}
        </View>
        <Text style={styles.actionText}>{text}</Text>
      </View>
      <LearningIcon name={learningIcons.arrow} color={studentTokens.navy} size={15} />
    </Pressable>
  );
}

export function LearningSectionTitle({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.76 },
  disabled: { opacity: 0.58 },
  pageHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 18, flexWrap: 'wrap' },
  headerCopy: { flex: 1, minWidth: 220 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  kicker: { color: studentTokens.orange, fontFamily, fontSize: 11, lineHeight: 16, fontWeight: '700', textTransform: 'uppercase' },
  pageTitle: { color: studentTokens.ink, fontFamily, fontSize: 34, lineHeight: 40, fontWeight: '700', marginTop: 2 },
  pageSubtitle: { color: studentTokens.muted, fontFamily, fontSize: 15, lineHeight: 22, fontWeight: '500', marginTop: 4, maxWidth: 720 },
  iconBubble: { alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  metricGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metricCard: { flexGrow: 1, flexBasis: 210, minWidth: 0, borderRadius: 11, borderColor: '#e5eaf2', shadowOpacity: 0.05, shadowRadius: 13, shadowOffset: { width: 0, height: 7 } },
  metricBody: { gap: 12 },
  metricTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  metricCopy: { flex: 1, minWidth: 0 },
  metricLabel: { color: '#6e778b', fontFamily, fontSize: 11, lineHeight: 15, fontWeight: '700', textTransform: 'uppercase' },
  metricValue: { color: studentTokens.ink, fontFamily, fontSize: 25, lineHeight: 30, fontWeight: '700', marginTop: 1 },
  metricNote: { color: studentTokens.muted, fontFamily, fontSize: 12, lineHeight: 17, fontWeight: '500', marginTop: 1 },
  metricProgress: { marginTop: 2 },
  actionCard: { minHeight: 94, flexGrow: 1, flexBasis: 280, minWidth: 240, borderRadius: 11, borderWidth: 1, borderColor: '#e5eaf2', backgroundColor: studentTokens.surface, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 12, shadowColor: '#000000', shadowOpacity: 0.04, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
  actionCopy: { flex: 1, minWidth: 0, gap: 4 },
  actionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  actionTitle: { color: studentTokens.ink, fontFamily, fontSize: 17, lineHeight: 23, fontWeight: '700', flexShrink: 1 },
  actionText: { color: studentTokens.text, fontFamily, fontSize: 13, lineHeight: 19, fontWeight: '500' },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' },
  sectionTitle: { color: studentTokens.ink, fontFamily, fontSize: 18, lineHeight: 24, fontWeight: '700' },
});

