import { useCallback, useMemo, useState, ChangeEvent } from 'react';
import { z } from 'zod';

export type EvidenceType = 'document' | 'glitch_puzzle' | 'mega_clue';

export type ValidationSeverity = 'error' | 'warning';

export type ValidationItem = {
  field: string;
  message: string;
  severity: ValidationSeverity;
};

export type DisplayConfig = {
  puzzle: Record<string, boolean>;
  fileProperties: Record<string, boolean>;
  media: Record<string, boolean>;
  cipher: Record<string, boolean>;
  megaClue: Record<string, boolean>;
};

export type UseCreateClueStateReturn = {
  formState: Record<string, any>;
  actions: Record<string, any>;
  validation: {
    validate: () => ValidationItem[];
    errors: ValidationItem[];
    schema: z.ZodType<any>;
  };
};

export default function useCreateClueState(investigationId?: string): UseCreateClueStateReturn {
  const [title, setTitle] = useState('');
  const [descPublic, setDescPublic] = useState('');
  const [descHidden, setDescHidden] = useState('');
  const [tags, setTags] = useState('');
  const [evidenceType, setEvidenceType] = useState<EvidenceType>('document');

  const [imgFile, setImgFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uvFile, setUvFile] = useState<File | null>(null);
  const [previewUrl2, setPreviewUrl2] = useState<string | null>(null);

  const [audioBase, setAudioBase] = useState<File | null>(null);
  const [audioBasePreview, setAudioBasePreview] = useState<string | null>(null);
  const [audioHidden, setAudioHidden] = useState<File | null>(null);
  const [audioHiddenPreview, setAudioHiddenPreview] = useState<string | null>(null);

  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [videoUrlInput, setVideoUrlInput] = useState('');

  const [megaFinalTruthText, setMegaFinalTruthText] = useState('');
  const [megaRequiredPuzzleIds, setMegaRequiredPuzzleIds] = useState<string[]>([]);
  const [glitchAccessInstructions, setGlitchAccessInstructions] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<ValidationItem[]>([]);

  const schema = useMemo(() => z.object({
    title: z.string().min(1, 'Título é obrigatório'),
    descPublic: z.string().optional(),
    evidenceType: z.enum(['document', 'glitch_puzzle', 'mega_clue']),
  }), []);

  const handleFileSelect = useCallback((fileSetter: (f: File | null) => void, urlSetter: (u: string | null) => void) => (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    fileSetter(file);
    urlSetter(url);
  }, []);

  const handleImageSelect = handleFileSelect(setImgFile, setPreviewUrl);
  const handleUVSelect = handleFileSelect(setUvFile, setPreviewUrl2);

  const validate = useCallback(() => {
    const items: ValidationItem[] = [];
    const parsed = schema.safeParse({ title, descPublic, evidenceType });
    if (!parsed.success) {
      parsed.error.issues.forEach((fe) => {
        items.push({ field: (fe.path.join('.') || 'title'), message: fe.message, severity: 'error' });
      });
    }

    if (evidenceType === 'glitch_puzzle' && !glitchAccessInstructions) {
      items.push({ field: 'glitchAccessInstructions', message: 'Instruções de Glitch são obrigatórias', severity: 'error' });
    }

    setErrors(items);
    return items;
  }, [schema, title, descPublic, evidenceType, glitchAccessInstructions]);

  const formState = useMemo(() => ({
    title,
    descPublic,
    descHidden,
    tags,
    evidenceType,
    imgFile,
    previewUrl,
    uvFile,
    previewUrl2,
    audioBase,
    audioBasePreview,
    audioHidden,
    audioHiddenPreview,
    videoFile,
    videoPreviewUrl,
    videoUrlInput,
    megaFinalTruthText,
    megaRequiredPuzzleIds,
    glitchAccessInstructions,
    loading,
  }), [
    title,
    descPublic,
    descHidden,
    tags,
    evidenceType,
    imgFile,
    previewUrl,
    uvFile,
    previewUrl2,
    audioBase,
    audioBasePreview,
    audioHidden,
    audioHiddenPreview,
    videoFile,
    videoPreviewUrl,
    videoUrlInput,
    megaFinalTruthText,
    megaRequiredPuzzleIds,
    glitchAccessInstructions,
    loading,
  ]);

  const actions = useMemo(() => ({
    setTitle,
    setDescPublic,
    setDescHidden,
    setTags,
    setEvidenceType,
    setImgFile,
    setPreviewUrl,
    setUvFile,
    setPreviewUrl2,
    setAudioBase,
    setAudioBasePreview,
    setAudioHidden,
    setAudioHiddenPreview,
    setVideoFile,
    setVideoPreviewUrl,
    setVideoUrlInput,
    setMegaFinalTruthText,
    setMegaRequiredPuzzleIds,
    setGlitchAccessInstructions,
    setLoading,
    handleImageSelect,
    handleUVSelect,
  }), [handleImageSelect, handleUVSelect]);

  return {
    formState,
    actions,
    validation: { validate, errors, schema },
  };
}
