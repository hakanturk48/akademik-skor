import type React from 'react';
import { ActivityIndicator, Modal as NativeModal, Pressable, StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type TextStyle, type ViewStyle } from 'react-native';

export const studentFontFamily = 'Quicksand';

export const studentTokens = {
  ink: '#20233a',
  text: '#565d70',
  muted: '#7a8092',
  page: '#f6f6f3',
  surface: '#ffffff',
  neutral: '#fbfbf8',
  navy: '#24263f',
  navySoft: '#373a5b',
  navyHover: '#303451',
  yellow: '#f4c431',
  yellowDeep: '#d99b00',
  yellowSoft: '#fff6d7',
  orange: '#f06a3d',
  orangeSoft: '#fff0e9',
  teal: '#007d73',
  tealSoft: '#e4f4f1',
  blue: '#5b75d8',
  blueSoft: '#edf1ff',
  line: '#dddeda',
  lineSoft: '#ebece7',
  danger: '#b42318',
  dangerSoft: '#fff1f0',
  success: '#007d73',
  successSoft: '#e4f4f1',
};

type Tone = 'default' | 'yellow' | 'teal' | 'orange' | 'blue' | 'danger';

type ButtonProps = {
  label: string;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'soft';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  left?: React.ReactNode;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
};

export function Button({ label, onPress, variant = 'primary', size = 'md', disabled = false, loading = false, left, right, style, textStyle, accessibilityLabel }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.button, styles[`button_${variant}`], styles[`button_${size}`], pressed ? styles.pressed : null, disabled || loading ? styles.disabled : null, style]}
    >
      {loading ? <ActivityIndicator color={variant === 'primary' ? studentTokens.navy : studentTokens.teal} size="small" /> : left}
      <Text style={[styles.buttonText, styles[`buttonText_${variant}`], styles[`buttonText_${size}`], textStyle]}>{label}</Text>
      {right}
    </Pressable>
  );
}

type CardProps = {
  children: React.ReactNode;
  testID?: string;
  title?: string;
  eyebrow?: string;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
};

export function Card({ children, title, eyebrow, right, style, contentStyle, testID }: CardProps) {
  return (
    <View testID={testID} style={[styles.card, style]}>
      {title || eyebrow || right ? (
        <View style={styles.cardHead}>
          <View style={styles.cardTitleGroup}>
            {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
            {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
          </View>
          {right}
        </View>
      ) : null}
      <View style={[styles.cardBody, contentStyle]}>{children}</View>
    </View>
  );
}

type ProgressProps = {
  value: number;
  max?: number;
  color?: string;
  label?: string;
  showValue?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Progress({ value, max = 100, color = studentTokens.teal, label, showValue = false, style }: ProgressProps) {
  const percent = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <View style={[styles.progressWrap, style]}>
      {label || showValue ? (
        <View style={styles.progressMeta}>
          {label ? <Text style={styles.progressLabel}>{label}</Text> : <View />}
          {showValue ? <Text style={styles.progressValue}>{Math.round(value)}/{max}</Text> : null}
        </View>
      ) : null}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

type BadgeProps = {
  label: string;
  tone?: Tone;
  style?: StyleProp<ViewStyle>;
};

export function Badge({ label, tone = 'default', style }: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`badge_${tone}`], style]}>
      <Text style={[styles.badgeText, styles[`badgeText_${tone}`]]}>{label}</Text>
    </View>
  );
}

type TabsProps<TValue extends string> = {
  items: { value: TValue; label: string; disabled?: boolean }[];
  value: TValue;
  onChange: (value: TValue) => void;
};

export function Tabs<TValue extends string>({ items, value, onChange }: TabsProps<TValue>) {
  return (
    <View accessibilityRole="tablist" style={styles.tabs}>
      {items.map((item) => {
        const selected = item.value === value;
        return (
          <Pressable
            key={item.value}
            accessibilityRole="tab"
            accessibilityState={{ selected, disabled: item.disabled }}
            disabled={item.disabled}
            onPress={() => onChange(item.value)}
            style={({ pressed }) => [styles.tab, selected ? styles.tabSelected : null, pressed ? styles.pressed : null, item.disabled ? styles.disabled : null]}
          >
            <Text style={[styles.tabText, selected ? styles.tabTextSelected : null]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  helper?: string;
  right?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
};

export function Input({ label, error, helper, right, containerStyle, style, ...props }: InputProps) {
  return (
    <View style={[styles.inputGroup, containerStyle]}>
      {label ? <Text style={styles.inputLabel}>{label}</Text> : null}
      <View style={[styles.inputShell, error ? styles.inputShellError : null]}>
        <TextInput placeholderTextColor={studentTokens.muted} style={[styles.input, style]} {...props} />
        {right}
      </View>
      {error ? <Text style={styles.inputError}>{error}</Text> : helper ? <Text style={styles.inputHelper}>{helper}</Text> : null}
    </View>
  );
}

type SearchProps = TextInputProps & {
  label?: string;
};

export function Search({ label = 'Ara', style, ...props }: SearchProps) {
  return <Input accessibilityLabel={label} placeholder="Ara" style={style} {...props} />;
}

type ModalProps = {
  visible: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  actions?: React.ReactNode;
};

export function Modal({ visible, title, children, onClose, actions }: ModalProps) {
  return (
    <NativeModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          <View style={styles.modalHead}>
            <Text style={styles.modalTitle}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Kapat" onPress={onClose} style={({ pressed }) => [styles.modalClose, pressed ? styles.pressed : null]}>
              <Text style={styles.modalCloseText}>x</Text>
            </Pressable>
          </View>
          <View style={styles.modalBody}>{children}</View>
          {actions ? <View style={styles.modalActions}>{actions}</View> : null}
        </View>
      </View>
    </NativeModal>
  );
}

type ToastProps = {
  visible: boolean;
  message: string;
  tone?: 'info' | 'success' | 'error';
};

export function Toast({ visible, message, tone = 'info' }: ToastProps) {
  if (!visible) return null;

  return (
    <View accessibilityLiveRegion="polite" style={[styles.toast, styles[`toast_${tone}`]]}>
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
}

export function Skeleton({ lines = 3, style }: { lines?: number; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.skeletonBox, style]}>
      {Array.from({ length: lines }).map((_, index) => (
        <View key={String(index)} style={[styles.skeletonLine, index === lines - 1 ? styles.skeletonLineShort : null]} />
      ))}
    </View>
  );
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <View style={styles.stateBox}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{text}</Text>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </View>
  );
}

export function ErrorState({ title, text, action }: { title: string; text: string; action?: React.ReactNode }) {
  return (
    <View style={[styles.stateBox, styles.errorStateBox]}>
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateText}>{text}</Text>
      {action ? <View style={styles.stateAction}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.54 },
  button: { borderRadius: 12, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, flexShrink: 0 },
  button_sm: { minHeight: 36, paddingHorizontal: 12 },
  button_md: { minHeight: 44, paddingHorizontal: 16 },
  button_lg: { minHeight: 52, paddingHorizontal: 20 },
  button_primary: { backgroundColor: studentTokens.yellow, borderColor: studentTokens.yellow },
  button_secondary: { backgroundColor: studentTokens.surface, borderColor: studentTokens.line },
  button_ghost: { backgroundColor: 'transparent', borderColor: 'transparent' },
  button_soft: { backgroundColor: studentTokens.tealSoft, borderColor: '#cae8e4' },
  buttonText: { fontWeight: '700', textAlign: 'center', flexShrink: 1 },
  buttonText_sm: { fontFamily: studentFontFamily, fontSize: 12, lineHeight: 17 },
  buttonText_md: { fontFamily: studentFontFamily, fontSize: 14, lineHeight: 20 },
  buttonText_lg: { fontFamily: studentFontFamily, fontSize: 15, lineHeight: 21 },
  buttonText_primary: { color: studentTokens.navy },
  buttonText_secondary: { color: studentTokens.ink },
  buttonText_ghost: { color: studentTokens.surface },
  buttonText_soft: { color: studentTokens.teal },
  card: { backgroundColor: studentTokens.surface, borderRadius: 16, borderWidth: 1, borderColor: studentTokens.lineSoft, padding: 18, shadowColor: '#000000', shadowOpacity: 0.07, shadowRadius: 18, shadowOffset: { width: 0, height: 9 }, minWidth: 0 },
  cardHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14, marginBottom: 15 },
  cardTitleGroup: { flex: 1, minWidth: 0 },
  eyebrow: { fontFamily: studentFontFamily, color: studentTokens.teal, fontSize: 12, lineHeight: 17, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  cardTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 21, lineHeight: 27, fontWeight: '700', flexShrink: 1 },
  cardBody: { minWidth: 0 },
  progressWrap: { gap: 8 },
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  progressLabel: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '600', flexShrink: 1 },
  progressValue: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  progressTrack: { height: 9, borderRadius: 999, backgroundColor: '#eceee8', overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 999 },
  badge: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1 },
  badge_default: { backgroundColor: studentTokens.neutral, borderColor: studentTokens.line },
  badge_yellow: { backgroundColor: studentTokens.yellowSoft, borderColor: '#f3dfa3' },
  badge_teal: { backgroundColor: studentTokens.tealSoft, borderColor: '#c7e8e3' },
  badge_orange: { backgroundColor: studentTokens.orangeSoft, borderColor: '#ffd8c9' },
  badge_blue: { backgroundColor: studentTokens.blueSoft, borderColor: '#d8defa' },
  badge_danger: { backgroundColor: studentTokens.dangerSoft, borderColor: '#ffd0cb' },
  badgeText: { fontFamily: studentFontFamily, fontSize: 11, lineHeight: 15, fontWeight: '700' },
  badgeText_default: { color: studentTokens.text },
  badgeText_yellow: { color: '#826400' },
  badgeText_teal: { color: studentTokens.teal },
  badgeText_orange: { color: studentTokens.orange },
  badgeText_blue: { color: studentTokens.blue },
  badgeText_danger: { color: studentTokens.danger },
  tabs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, backgroundColor: studentTokens.neutral, borderRadius: 14, borderWidth: 1, borderColor: studentTokens.lineSoft, padding: 5 },
  tab: { minHeight: 34, borderRadius: 10, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  tabSelected: { backgroundColor: studentTokens.surface, shadowColor: '#000000', shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  tabText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  tabTextSelected: { color: studentTokens.ink, fontWeight: '700' },
  inputGroup: { gap: 6, minWidth: 0 },
  inputLabel: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  inputShell: { minHeight: 42, borderRadius: 12, borderWidth: 1, borderColor: studentTokens.line, backgroundColor: studentTokens.surface, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  inputShellError: { borderColor: studentTokens.danger, backgroundColor: studentTokens.dangerSoft },
  input: { fontFamily: studentFontFamily, flex: 1, minWidth: 0, minHeight: 40, borderWidth: 0, paddingHorizontal: 13, color: studentTokens.ink, fontSize: 14, lineHeight: 20, fontWeight: '600', outlineStyle: 'none' as never },
  inputError: { fontFamily: studentFontFamily, color: studentTokens.danger, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  inputHelper: { fontFamily: studentFontFamily, color: studentTokens.muted, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(20,22,35,0.56)', alignItems: 'center', justifyContent: 'center', padding: 18 },
  modalCard: { width: '100%', maxWidth: 520, borderRadius: 16, backgroundColor: studentTokens.surface, padding: 18, shadowColor: '#000000', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 14 } },
  modalHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14, marginBottom: 10 },
  modalTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 22, lineHeight: 28, fontWeight: '700', flexShrink: 1 },
  modalClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: studentTokens.neutral, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 20, lineHeight: 22, fontWeight: '700' },
  modalBody: { gap: 10 },
  modalActions: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 10, marginTop: 16 },
  toast: { position: 'absolute', right: 18, top: 78, zIndex: 20, maxWidth: 360, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, shadowColor: '#000000', shadowOpacity: 0.14, shadowRadius: 16, shadowOffset: { width: 0, height: 8 } },
  toast_info: { backgroundColor: studentTokens.navySoft },
  toast_success: { backgroundColor: studentTokens.teal },
  toast_error: { backgroundColor: studentTokens.danger },
  toastText: { fontFamily: studentFontFamily, color: '#ffffff', fontSize: 13, lineHeight: 19, fontWeight: '600' },
  skeletonBox: { gap: 10, padding: 14, borderRadius: 14, backgroundColor: studentTokens.surface, borderWidth: 1, borderColor: studentTokens.lineSoft },
  skeletonLine: { height: 14, borderRadius: 8, backgroundColor: '#eceee8', width: '100%' },
  skeletonLineShort: { width: '62%' },
  stateBox: { width: '100%', borderRadius: 16, borderWidth: 1, borderColor: studentTokens.lineSoft, backgroundColor: studentTokens.surface, padding: 22, alignItems: 'flex-start', gap: 10 },
  errorStateBox: { borderColor: '#ffd0cb', backgroundColor: studentTokens.dangerSoft },
  stateTitle: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 24, lineHeight: 31, fontWeight: '700' },
  stateText: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 14, lineHeight: 22, fontWeight: '600', maxWidth: 620 },
  stateAction: { marginTop: 8 },
});



