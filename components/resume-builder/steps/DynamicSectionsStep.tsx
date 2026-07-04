'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import {
  DYNAMIC_SECTION_REGISTRY,
  getActiveDynamicSections,
  readExtendedSections,
  writeExtendedSection,
  type DynamicSectionSpec,
} from '@/lib/resume-builder/dynamic-section-registry';
import type { ExtendedBuilderSections } from '@/lib/resume-builder/canonical-mapping/types';

interface DynamicSectionsStepProps {
  formData: Record<string, unknown>;
  updateFormData: (updates: Record<string, unknown>) => void;
}

function StringListEditor({
  items,
  onChange,
  placeholder,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addItem = () => onChange([...items, '']);

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex gap-2 items-start">
          <Textarea
            value={item}
            onChange={(e) => updateItem(index, e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="flex-1 min-w-0"
          />
          <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)}>
            <Trash2 className="w-4 h-4 text-red-500" />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addItem} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add entry
      </Button>
    </div>
  );
}

function RecordListEditor({
  items,
  fields,
  onChange,
}: {
  items: Array<Record<string, unknown>>;
  fields: NonNullable<DynamicSectionSpec['recordFields']>;
  onChange: (items: Array<Record<string, unknown>>) => void;
}) {
  const updateEntry = (index: number, key: string, value: string) => {
    const next = items.map((entry, i) =>
      i === index ? { ...entry, [key]: value } : entry
    );
    onChange(next);
  };

  const removeEntry = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const addEntry = () => {
    const blank: Record<string, unknown> = {};
    for (const f of fields) blank[f.key] = '';
    onChange([...items, blank]);
  };

  return (
    <div className="space-y-4">
      {items.map((entry, index) => (
        <div
          key={index}
          className="rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-3"
        >
          <div className="flex justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => removeEntry(index)}>
              <Trash2 className="w-4 h-4 mr-1 text-red-500" />
              Remove
            </Button>
          </div>
          <div className="grid grid-cols-1 gap-3">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1">
                <Label className="text-sm font-medium">{field.label}</Label>
                {field.type === 'textarea' ? (
                  <Textarea
                    value={String(entry[field.key] ?? '')}
                    onChange={(e) => updateEntry(index, field.key, e.target.value)}
                    placeholder={field.placeholder}
                    rows={3}
                  />
                ) : (
                  <Input
                    type={field.type || 'text'}
                    value={String(entry[field.key] ?? '')}
                    onChange={(e) => updateEntry(index, field.key, e.target.value)}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addEntry} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add entry
      </Button>
    </div>
  );
}

function SectionBlock({
  spec,
  extended,
  onUpdate,
}: {
  spec: DynamicSectionSpec;
  extended: ExtendedBuilderSections;
  onUpdate: (value: unknown) => void;
}) {
  const value = extended[spec.fieldKey];

  return (
    <section className="space-y-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">{spec.label}</h3>
        <p className="text-sm text-gray-600">{spec.description}</p>
      </div>

      {spec.kind === 'stringList' && (
        <StringListEditor
          items={Array.isArray(value) ? (value as string[]) : []}
          onChange={onUpdate}
          placeholder={`Enter ${spec.label.toLowerCase()}...`}
        />
      )}

      {spec.kind === 'recordList' && spec.recordFields && (
        <RecordListEditor
          items={Array.isArray(value) ? (value as Array<Record<string, unknown>>) : []}
          fields={spec.recordFields}
          onChange={onUpdate}
        />
      )}

      {spec.kind === 'textarea' && (
        <Textarea
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onUpdate(e.target.value)}
          rows={4}
          placeholder={`Enter ${spec.label.toLowerCase()}...`}
        />
      )}

      {spec.kind === 'keyValue' && (
        <KeyValueEditor
          data={
            value && typeof value === 'object' && !Array.isArray(value)
              ? (value as Record<string, string>)
              : {}
          }
          onChange={onUpdate}
        />
      )}
    </section>
  );
}

function KeyValueEditor({
  data,
  onChange,
}: {
  data: Record<string, string>;
  onChange: (data: Record<string, string>) => void;
}) {
  const entries = Object.entries(data);

  const updateKey = (index: number, key: string, val: string) => {
    const next: Record<string, string> = {};
    entries.forEach(([k, v], i) => {
      if (i === index) next[key] = val;
      else next[k] = v;
    });
    onChange(next);
  };

  const removeEntry = (index: number) => {
    const next: Record<string, string> = {};
    entries.forEach(([k, v], i) => {
      if (i !== index) next[k] = v;
    });
    onChange(next);
  };

  const addEntry = () => {
    onChange({ ...data, '': '' });
  };

  return (
    <div className="space-y-3">
      {entries.map(([key, val], index) => (
        <div key={index} className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-start">
          <Input
            value={key}
            onChange={(e) => updateKey(index, e.target.value, val)}
            placeholder="Field name"
          />
          <div className="flex gap-2">
            <Textarea
              value={val}
              onChange={(e) => updateKey(index, key, e.target.value)}
              placeholder="Value"
              rows={2}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(index)}>
              <Trash2 className="w-4 h-4 text-red-500" />
            </Button>
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={addEntry}>
        <Plus className="w-4 h-4 mr-2" />
        Add field
      </Button>
    </div>
  );
}

export default function DynamicSectionsStep({ formData, updateFormData }: DynamicSectionsStepProps) {
  const extended = useMemo(() => readExtendedSections(formData), [formData]);
  const activeSections = useMemo(() => getActiveDynamicSections(formData), [formData]);

  const handleSectionUpdate = (spec: DynamicSectionSpec, value: unknown) => {
    updateFormData(writeExtendedSection(formData, spec.fieldKey, value));
  };

  if (activeSections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      {activeSections.map((spec) => (
        <SectionBlock
          key={spec.id}
          spec={spec}
          extended={extended}
          onUpdate={(value) => handleSectionUpdate(spec, value)}
        />
      ))}
    </div>
  );
}

/** All registry specs — used for audit comparisons. */
export { DYNAMIC_SECTION_REGISTRY };
