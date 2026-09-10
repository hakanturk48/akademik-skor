import { useState } from 'react';
import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, studentFontFamily, studentTokens } from '@/components/student/ui';
import type { ContentCatalog, TaxonomyRef } from '@/lib/content';
import type { AdminQuestionDraft } from '@/lib/admin/types';

type Choice = { id: string; title: string };

function OptionAction({ label, icon, ios, disabled, onPress }: { label: string; icon: AndroidSymbol; ios: SFSymbol; disabled?: boolean; onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.iconButton, disabled && styles.disabled]}>
    <SymbolView name={{ ios, android: icon, web: icon }} size={20} tintColor={studentTokens.ink} style={{ width: 20, height: 20 }} />
  </Pressable>;
}

function FieldMenu({ label, values, selected, onSelect, multiple = false }: { label: string; values: Choice[]; selected: string[]; onSelect: (id: string) => void; multiple?: boolean }) {
  const [open, setOpen] = useState(false);
  const labels = selected.filter(Boolean).map((id) => values.find((value) => value.id === id)?.title ?? `Kullanılamıyor (${id})`);
  return <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={`${label} seçin`} aria-expanded={open} accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.select}>
      <Text style={styles.body}>{labels.join(', ') || 'Seçin'}</Text>
    </Pressable>
    {open ? <View style={styles.menu}>
      {!values.length ? <Text style={styles.body}>Eşleşen kayıt yok.</Text> : values.map((value) => <Pressable key={value.id} accessibilityRole={multiple ? 'checkbox' : 'radio'} accessibilityLabel={`${label}: ${value.title}`} aria-checked={selected.includes(value.id)} accessibilityState={{ checked: selected.includes(value.id) }} onPress={() => { onSelect(value.id); if (!multiple) setOpen(false); }} style={[styles.choice, selected.includes(value.id) && styles.selected]}>
        <View style={[styles.marker, multiple && styles.checkbox, selected.includes(value.id) && styles.checked]} /><Text style={styles.body}>{value.title}</Text>
      </Pressable>)}
    </View> : null}
  </View>;
}

export function AdminQuestionFields({ catalog, value, onChange }: { catalog: ContentCatalog; value: AdminQuestionDraft; onChange: (value: AdminQuestionDraft) => void }) {
  const [removeId, setRemoveId] = useState<string | null>(null);
  const taxonomy = value.taxonomy;
  const setTaxonomy = (patch: Partial<TaxonomyRef>) => onChange({ ...value, taxonomy: { ...taxonomy, ...patch } });
  const active = <T extends Choice & { status: string }>(items: T[]) => items.filter((item) => item.status === 'active');
  const toggle = (ids: string[], id: string) => ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];
  const changeOption = (id: string, patch: { body?: string; rationale?: string }) => onChange({ ...value, options: value.options.map((option) => option.id === id ? { ...option, ...patch } : option) });
  const move = (index: number, offset: number) => {
    const options = [...value.options];
    [options[index], options[index + offset]] = [options[index + offset], options[index]];
    onChange({ ...value, options });
  };
  return <View testID="admin-question-fields" style={styles.stack}>
    <Text style={styles.heading}>Soru sınıflandırması</Text>
    <View style={styles.grid}>
      <FieldMenu label="Sınav" values={active(catalog.exams)} selected={[taxonomy.examId]} onSelect={(examId) => setTaxonomy({ examId, examVersionId: '' })} />
      <FieldMenu label="Sınav Sürümü" values={active(catalog.examVersions).filter((item) => item.examId === taxonomy.examId)} selected={[taxonomy.examVersionId]} onSelect={(examVersionId) => setTaxonomy({ examVersionId })} />
      <FieldMenu label="Beceri" values={active(catalog.skills)} selected={[taxonomy.skillId]} onSelect={(skillId) => setTaxonomy({ skillId, taskTypeId: undefined, subskillIds: [], topicIds: [] })} />
      <FieldMenu label="Soru Türü" values={active(catalog.taskTypes).filter((item) => item.skillId === taxonomy.skillId)} selected={[taxonomy.taskTypeId ?? '']} onSelect={(taskTypeId) => setTaxonomy({ taskTypeId, subskillIds: [] })} />
      <FieldMenu label="Alt Beceriler" multiple values={active(catalog.subskills).filter((item) => item.skillId === taxonomy.skillId && (!taxonomy.taskTypeId || item.taskTypeIds.includes(taxonomy.taskTypeId)))} selected={taxonomy.subskillIds} onSelect={(id) => setTaxonomy({ subskillIds: toggle(taxonomy.subskillIds, id) })} />
      <FieldMenu label="Konular" multiple values={active(catalog.topics).filter((item) => item.skillIds.includes(taxonomy.skillId))} selected={taxonomy.topicIds} onSelect={(id) => setTaxonomy({ topicIds: toggle(taxonomy.topicIds, id) })} />
      <FieldMenu label="Zorluk" values={active(catalog.levels)} selected={[taxonomy.levelId ?? '']} onSelect={(levelId) => setTaxonomy({ levelId })} />
    </View>
    <Text style={styles.label}>Parça / kaynak metin</Text>
    <TextInput accessibilityLabel="Parça / kaynak metin" value={value.stimulus} onChangeText={(stimulus) => onChange({ ...value, stimulus })} multiline style={styles.input} />
    <Text style={styles.heading}>Cevap Seçenekleri</Text>
    {value.options.map((option, index) => <View key={option.id} style={styles.option}>
      <Text style={styles.label}>Seçenek {index + 1}</Text>
      <TextInput accessibilityLabel={`Seçenek ${index + 1} metni`} value={option.body} onChangeText={(body) => changeOption(option.id, { body })} multiline style={styles.input} />
      <Pressable accessibilityRole="radio" accessibilityLabel={`Seçenek ${index + 1} doğru cevap`} aria-checked={value.correctOptionId === option.id} accessibilityState={{ checked: value.correctOptionId === option.id }} onPress={() => onChange({ ...value, correctOptionId: option.id })} style={styles.choice}>
        <View style={[styles.marker, value.correctOptionId === option.id && styles.checked]} /><Text style={styles.body}>Doğru cevap</Text>
      </Pressable>
      <Text style={styles.label}>Gerekçe</Text>
      <TextInput accessibilityLabel={`Seçenek ${index + 1} gerekçesi`} value={option.rationale} onChangeText={(rationale) => changeOption(option.id, { rationale })} multiline style={styles.input} />
      <View style={styles.actions}>
        <OptionAction label={`Seçenek ${index + 1} yukarı taşı`} icon="arrow_upward" ios="arrow.up" disabled={index === 0} onPress={() => move(index, -1)} />
        <OptionAction label={`Seçenek ${index + 1} aşağı taşı`} icon="arrow_downward" ios="arrow.down" disabled={index === value.options.length - 1} onPress={() => move(index, 1)} />
        <OptionAction label={`Seçenek ${index + 1} kaldır`} icon="delete" ios="trash" onPress={() => setRemoveId(option.id)} />
      </View>
      {removeId === option.id ? <View style={styles.stack}>
        <Text accessibilityRole="alert" style={styles.body}>Bu seçenek taslaktan kaldırılsın mı?</Text>
        <View style={styles.actions}><Button label="Kaldırmaktan vazgeç" variant="secondary" onPress={() => setRemoveId(null)} /><Button label="Kaldırmayı onayla" onPress={() => { onChange({ ...value, options: value.options.filter((item) => item.id !== option.id), correctOptionId: value.correctOptionId === option.id ? undefined : value.correctOptionId }); setRemoveId(null); }} /></View>
      </View> : null}
    </View>)}
    <Button label="Seçenek Ekle" variant="secondary" onPress={() => onChange({ ...value, options: [...value.options, { id: `option-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`, body: '', rationale: '' }] })} />
  </View>;
}

const styles = StyleSheet.create({
  stack: { gap: 12, minWidth: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  field: { flexBasis: 250, flexGrow: 1, flexShrink: 1, minWidth: 0, gap: 6 },
  label: { fontFamily: studentFontFamily, color: studentTokens.text, fontSize: 13, fontWeight: '600' },
  heading: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 17, fontWeight: '600' },
  body: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 21, flexShrink: 1 },
  input: { fontFamily: studentFontFamily, color: studentTokens.ink, fontSize: 14, lineHeight: 21, minHeight: 64, borderWidth: 1, borderColor: studentTokens.line, borderRadius: 6, padding: 10, textAlignVertical: 'top' },
  select: { minHeight: 44, padding: 10, borderWidth: 1, borderColor: studentTokens.line, borderRadius: 6, justifyContent: 'center' },
  menu: { borderWidth: 1, borderColor: studentTokens.line, borderRadius: 6, padding: 6, gap: 4 },
  choice: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 10, padding: 6 },
  selected: { backgroundColor: '#e5f4f1' },
  marker: { width: 18, height: 18, borderWidth: 2, borderColor: studentTokens.teal, borderRadius: 9, flexShrink: 0 },
  checked: { backgroundColor: studentTokens.teal },
  checkbox: { borderRadius: 3 },
  option: { gap: 8, borderTopWidth: 1, borderTopColor: studentTokens.line, paddingVertical: 12, minWidth: 0 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  iconButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: studentTokens.line, borderRadius: 6 },
  disabled: { opacity: 0.4 },
});
