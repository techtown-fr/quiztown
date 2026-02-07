import React, { useState, useRef, lazy, Suspense } from 'react';
import type { QuizQuestion, QuizOption, QuizMedia } from '../types/quiz';
import { TILE_PICTOGRAMS, TILE_COLORS } from './ui/VoteTile';

const GifPicker = lazy(() => import('./ui/GifPicker'));
const EmojiPickerPopover = lazy(() => import('./ui/EmojiPickerPopover'));

interface Props {
  lang: 'fr' | 'en';
  onSave?: (title: string, description: string, questions: QuizQuestion[]) => void;
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
    remove: 'Supprimer',
    addGif: 'GIF',
    emoji: 'Emoji',
    removeMedia: 'Supprimer le média',
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
    remove: 'Remove',
    addGif: 'GIF',
    emoji: 'Emoji',
    removeMedia: 'Remove media',
  },
};

export default function QuizEditor({ lang, onSave }: Props) {
  const t = labels[lang];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([EMPTY_QUESTION()]);
  const [gifPickerIndex, setGifPickerIndex] = useState<number | null>(null);
  const [emojiPickerIndex, setEmojiPickerIndex] = useState<number | null>(null);
  const emojiButtonRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

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

  const handleSave = () => {
    onSave?.(title, description, questions);
  };

  const handleGifSelect = (qIndex: number, url: string, alt: string): void => {
    const media: QuizMedia = { type: 'gif', url, alt };
    updateQuestion(qIndex, 'media', media);
    setGifPickerIndex(null);
  };

  const handleRemoveMedia = (qIndex: number): void => {
    updateQuestion(qIndex, 'media', undefined);
  };

  const handleEmojiSelect = (qIndex: number, emoji: string): void => {
    const currentLabel = questions[qIndex].label;
    updateQuestion(qIndex, 'label', currentLabel + emoji);
    setEmojiPickerIndex(null);
  };

  const setEmojiButtonRef = (index: number, el: HTMLButtonElement | null): void => {
    if (el) {
      emojiButtonRefs.current.set(index, el);
    } else {
      emojiButtonRefs.current.delete(index);
    }
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
            background: 'white',
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
            <div style={{ position: 'relative' }}>
              <button
                ref={(el) => setEmojiButtonRef(qIndex, el)}
                onClick={() => setEmojiPickerIndex(emojiPickerIndex === qIndex ? null : qIndex)}
                style={mediaBtnStyle}
                title={t.emoji}
                type="button"
              >
                😀
              </button>
              {emojiPickerIndex === qIndex && (
                <Suspense fallback={null}>
                  <EmojiPickerPopover
                    lang={lang}
                    onSelect={(emoji) => handleEmojiSelect(qIndex, emoji)}
                    onClose={() => setEmojiPickerIndex(null)}
                    anchorRef={{ current: emojiButtonRefs.current.get(qIndex) ?? null }}
                  />
                </Suspense>
              )}
            </div>
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
                border: '2px solid rgba(15,23,42,0.08)',
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
                  border: `2px solid ${option.isCorrect ? 'var(--color-mint-pop)' : 'rgba(15,23,42,0.1)'}`,
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
        <button onClick={handleSave} style={primaryBtnStyle}>
          {t.save}
        </button>
      </div>

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
  border: '2px solid rgba(15,23,42,0.1)',
  borderRadius: 'var(--radius-button)',
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
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
  background: 'rgba(15,23,42,0.04)',
  color: 'var(--color-dark-slate)',
  border: '2px solid rgba(15,23,42,0.1)',
  borderRadius: 'var(--radius-button)',
  cursor: 'pointer',
  transition: 'border-color 0.15s, background 0.15s',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};
