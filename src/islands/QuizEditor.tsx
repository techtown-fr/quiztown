import React, { useState, lazy, Suspense } from 'react';
import type { QuizQuestion, QuizOption, QuizMedia } from '../types/quiz';
import { TILE_PICTOGRAMS, TILE_COLORS } from './ui/VoteTile';

const GifPicker = lazy(() => import('./ui/GifPicker'));

interface SaveResult {
  success: boolean;
  message: string;
}

interface Props {
  lang: 'fr' | 'en';
  onSave?: (title: string, description: string, questions: QuizQuestion[]) => Promise<SaveResult>;
  /** Pre-fill the editor with existing data (edit mode) */
  initialTitle?: string;
  initialDescription?: string;
  initialQuestions?: QuizQuestion[];
}

const EMPTY_OPTION: () => QuizOption = () => ({
  id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  text: '',
  isCorrect: false,
});

const EMPTY_QUESTION: () => QuizQuestion = () => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  type: 'multiple-choice',
  label: '',
  options: [EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION(), EMPTY_OPTION()],
  timeLimit: 20,
});

const labels = {
  fr: {
    title: 'Titre du quiz',
    titlePlaceholder: 'Mon super quiz...',
    description: 'Description',
    descriptionPlaceholder: 'De quoi parle ce quiz ?',
    addQuestion: '+ Ajouter une question',
    question: 'Question',
    questionPlaceholder: 'Écris ta question ici...',
    option: 'Réponse',
    optionPlaceholder: 'Réponse...',
    correct: 'Correcte',
    timeLimit: 'Temps (s)',
    save: 'Sauvegarder',
    update: 'Mettre à jour',
    saving: 'Sauvegarde...',
    remove: 'Supprimer',
    addGif: 'GIF',
    removeMedia: 'Supprimer le média',
    errorTitle: 'Le titre du quiz est requis.',
    errorQuestion: 'La question {n} n\'a pas de texte.',
    errorNoCorrect: 'La question {n} n\'a pas de bonne réponse.',
    errorOption: 'La question {n} a des réponses vides.',
    successSave: 'Quiz sauvegardé avec succès !',
    errorSave: 'Erreur lors de la sauvegarde.',
  },
  en: {
    title: 'Quiz title',
    titlePlaceholder: 'My awesome quiz...',
    description: 'Description',
    descriptionPlaceholder: 'What is this quiz about?',
    addQuestion: '+ Add a question',
    question: 'Question',
    questionPlaceholder: 'Write your question here...',
    option: 'Answer',
    optionPlaceholder: 'Answer...',
    correct: 'Correct',
    timeLimit: 'Time (s)',
    save: 'Save',
    update: 'Update',
    saving: 'Saving...',
    remove: 'Remove',
    addGif: 'GIF',
    removeMedia: 'Remove media',
    errorTitle: 'Quiz title is required.',
    errorQuestion: 'Question {n} has no text.',
    errorNoCorrect: 'Question {n} has no correct answer.',
    errorOption: 'Question {n} has empty answers.',
    successSave: 'Quiz saved successfully!',
    errorSave: 'Failed to save the quiz.',
  },
};

interface Toast {
  message: string;
  type: 'success' | 'error';
}

export default function QuizEditor({ lang, onSave, initialTitle, initialDescription, initialQuestions }: Props) {
  const t = labels[lang];
  const isEditMode = !!(initialTitle || initialQuestions);
  const [title, setTitle] = useState(initialTitle ?? '');
  const [description, setDescription] = useState(initialDescription ?? '');
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions && initialQuestions.length > 0 ? initialQuestions : [EMPTY_QUESTION()]
  );
  const [gifPickerIndex, setGifPickerIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const addQuestion = () => {
    setQuestions((prev) => [...prev, EMPTY_QUESTION()]);
  };

  const removeQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, i) => (i === index ? { ...q, [field]: value } : q))
    );
  };

  const updateOption = (qIndex: number, oIndex: number, field: keyof QuizOption, value: unknown) => {
    setQuestions((prev) =>
      prev.map((q, qi) => {
        if (qi !== qIndex) return q;
        const newOptions = q.options.map((opt, oi) => {
          if (oi !== oIndex) {
            // If setting isCorrect, unset others
            if (field === 'isCorrect' && value === true) {
              return { ...opt, isCorrect: false };
            }
            return opt;
          }
          return { ...opt, [field]: value };
        });
        return { ...q, options: newOptions };
      })
    );
  };

  const validate = (): string | null => {
    if (!title.trim()) return t.errorTitle;
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.label.trim()) return t.errorQuestion.replace('{n}', String(i + 1));
      const filledOptions = q.options.filter((o) => o.text.trim());
      if (filledOptions.length < 2) return t.errorOption.replace('{n}', String(i + 1));
      if (!q.options.some((o) => o.isCorrect)) return t.errorNoCorrect.replace('{n}', String(i + 1));
    }
    return null;
  };

  const handleSave = async () => {
    const error = validate();
    if (error) {
      showToast(error, 'error');
      return;
    }
    if (!onSave) return;
    setSaving(true);
    try {
      const result = await onSave(title, description, questions);
      showToast(result.message, result.success ? 'success' : 'error');
    } catch {
      showToast(t.errorSave, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleGifSelect = (qIndex: number, url: string, alt: string): void => {
    const media: QuizMedia = { type: 'gif', url, alt };
    updateQuestion(qIndex, 'media', media);
    setGifPickerIndex(null);
  };

  const handleRemoveMedia = (qIndex: number): void => {
    setQuestions((prev) =>
      prev.map((q, i) => {
        if (i !== qIndex) return q;
        const { media: _removed, ...rest } = q;
        return rest as QuizQuestion;
      })
    );
  };

  const optionColors = TILE_COLORS.map((c) => c.bg);

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      {/* Quiz Meta */}
      <div style={{ marginBottom: '2rem' }}>
        <label style={labelStyle}>{t.title}</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.titlePlaceholder}
          style={inputStyle}
        />

        <label style={{ ...labelStyle, marginTop: '1rem' }}>{t.description}</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t.descriptionPlaceholder}
          rows={2}
          style={{ ...inputStyle, resize: 'vertical' }}
        />
      </div>

      {/* Questions */}
      {questions.map((question, qIndex) => (
        <div
          key={question.id}
          style={{
            background: 'var(--color-card-bg)',
            color: 'var(--color-card-text)',
            borderRadius: 'var(--radius-card)',
            boxShadow: 'var(--shadow-card)',
            padding: '1.5rem',
            marginBottom: '1.5rem',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1rem' }}>
              {t.question} {qIndex + 1}
            </h3>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label style={{ fontSize: '0.8rem', opacity: 0.6 }}>{t.timeLimit}</label>
              <select
                value={question.timeLimit}
                onChange={(e) => updateQuestion(qIndex, 'timeLimit', Number(e.target.value))}
                style={{ ...inputStyle, width: 'auto', padding: '0.4rem' }}
              >
                {[10, 15, 20, 30, 45, 60].map((s) => (
                  <option key={s} value={s}>{s}s</option>
                ))}
              </select>
              {questions.length > 1 && (
                <button
                  onClick={() => removeQuestion(qIndex)}
                  style={removeBtnStyle}
                  title={t.remove}
                >
                  &times;
                </button>
              )}
            </div>
          </div>

          {/* Question input + media buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem' }}>
            <input
              type="text"
              value={question.label}
              onChange={(e) => updateQuestion(qIndex, 'label', e.target.value)}
              placeholder={t.questionPlaceholder}
              style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 600, margin: 0, flex: 1 }}
            />
            <button
              onClick={() => setGifPickerIndex(qIndex)}
              style={mediaBtnStyle}
              title={t.addGif}
              type="button"
            >
              🎬 {t.addGif}
            </button>
          </div>

          {/* Media preview */}
          {question.media?.url && (
            <div
              style={{
                position: 'relative',
                marginBottom: '1rem',
                borderRadius: 'var(--radius-button)',
                overflow: 'hidden',
                background: 'rgba(15,23,42,0.03)',
                border: '2px solid var(--color-card-border)',
                display: 'inline-block',
                maxWidth: '100%',
              }}
            >
              <img
                src={question.media.url}
                alt={question.media.alt ?? ''}
                style={{
                  display: 'block',
                  maxHeight: 200,
                  maxWidth: '100%',
                  objectFit: 'contain',
                  borderRadius: 'var(--radius-button)',
                }}
              />
              <button
                onClick={() => handleRemoveMedia(qIndex)}
                style={{
                  position: 'absolute',
                  top: 6,
                  right: 6,
                  width: 28,
                  height: 28,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(15,23,42,0.7)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                }}
                title={t.removeMedia}
                type="button"
              >
                ✕
              </button>
            </div>
          )}

          {/* Options */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {question.options.map((option, oIndex) => (
              <div
                key={option.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.5rem',
                  borderRadius: 'var(--radius-button)',
                  border: `2px solid ${option.isCorrect ? 'var(--color-mint-pop)' : 'var(--color-card-border)'}`,
                  background: option.isCorrect ? 'rgba(45,212,191,0.05)' : 'transparent',
                  transition: 'border-color 0.15s, background 0.15s',
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 6,
                    background: optionColors[oIndex],
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  {TILE_PICTOGRAMS[oIndex]?.symbol}
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(qIndex, oIndex, 'text', e.target.value)}
                  placeholder={`${t.optionPlaceholder}`}
                  style={{ ...inputStyle, border: 'none', padding: '0.25rem', background: 'transparent', flex: 1 }}
                />
                <label style={{ fontSize: '0.7rem', opacity: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <input
                    type="radio"
                    name={`correct_${question.id}`}
                    checked={option.isCorrect}
                    onChange={() => updateOption(qIndex, oIndex, 'isCorrect', true)}
                  />
                  {t.correct}
                </label>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <button onClick={addQuestion} style={secondaryBtnStyle}>
          {t.addQuestion}
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            ...primaryBtnStyle,
            opacity: saving ? 0.7 : 1,
            cursor: saving ? 'not-allowed' : 'pointer',
          }}
        >
          {saving ? t.saving : (isEditMode ? t.update : t.save)}
        </button>
      </div>

      {/* Toast notification */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '0.85rem 1.5rem',
            borderRadius: 'var(--radius-button)',
            background: toast.type === 'success' ? 'var(--color-mint-pop)' : 'var(--color-alert-coral)',
            color: toast.type === 'success' ? '#064e3b' : '#fff',
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: '0.95rem',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            zIndex: 1000,
            animation: 'toastIn 0.3s ease-out',
            maxWidth: '90vw',
            textAlign: 'center',
          }}
          role="alert"
        >
          {toast.type === 'success' ? '✓ ' : '✗ '}{toast.message}
        </div>
      )}

      {/* GIF Picker Modal */}
      {gifPickerIndex !== null && (
        <Suspense fallback={null}>
          <GifPicker
            lang={lang}
            onSelect={(url, alt) => handleGifSelect(gifPickerIndex, url, alt)}
            onClose={() => setGifPickerIndex(null)}
          />
        </Suspense>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: '0.85rem',
  marginBottom: '0.25rem',
  opacity: 0.8,
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  fontFamily: 'var(--font-body)',
  fontSize: '1rem',
  border: '2px solid var(--color-card-border)',
  borderRadius: 'var(--radius-button)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
  background: 'var(--color-card-bg)',
  color: 'var(--color-card-text)',
};

const primaryBtnStyle: React.CSSProperties = {
  padding: '0.75rem 2rem',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: '1rem',
  background: 'linear-gradient(135deg, var(--color-electric-blue), var(--color-violet-pulse))',
  color: 'white',
  border: 'none',
  borderRadius: 'var(--radius-button)',
  cursor: 'pointer',
  transition: 'transform 0.15s, box-shadow 0.15s',
};

const secondaryBtnStyle: React.CSSProperties = {
  padding: '0.75rem 2rem',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: '1rem',
  background: 'transparent',
  color: 'var(--color-electric-blue)',
  border: '2px solid var(--color-electric-blue)',
  borderRadius: 'var(--radius-button)',
  cursor: 'pointer',
  transition: 'transform 0.15s',
};

const removeBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(251,113,133,0.1)',
  color: 'var(--color-alert-coral)',
  border: 'none',
  borderRadius: '50%',
  cursor: 'pointer',
  fontSize: '1.2rem',
  fontWeight: 700,
};

const mediaBtnStyle: React.CSSProperties = {
  padding: '0.5rem 0.75rem',
  fontFamily: 'var(--font-display)',
  fontWeight: 600,
  fontSize: '0.8rem',
  background: 'var(--color-card-bg)',
  color: 'var(--color-card-text)',
  border: '2px solid var(--color-card-border)',
  borderRadius: 'var(--radius-button)',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};
