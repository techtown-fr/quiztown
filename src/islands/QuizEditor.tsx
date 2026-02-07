import React, { useState } from 'react';
import type { QuizQuestion, QuizOption } from '../types/quiz';

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
  },
};

export default function QuizEditor({ lang, onSave }: Props) {
  const t = labels[lang];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [questions, setQuestions] = useState<QuizQuestion[]>([EMPTY_QUESTION()]);

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

  const optionColors = [
    'var(--color-electric-blue)',
    'var(--color-alert-coral)',
    'var(--color-mint-pop)',
    'var(--color-violet-pulse)',
  ];

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

          <input
            type="text"
            value={question.label}
            onChange={(e) => updateQuestion(qIndex, 'label', e.target.value)}
            placeholder={t.questionPlaceholder}
            style={{ ...inputStyle, fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}
          />

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
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    background: optionColors[oIndex],
                    flexShrink: 0,
                  }}
                />
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
