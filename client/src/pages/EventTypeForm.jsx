/**
 * EventTypeForm Page
 * 
 * Create or edit an event type. Uses the same form for both
 * create (POST) and edit (PUT) mode, determined by the URL.
 * 
 * If URL is /event-types/new → create mode
 * If URL is /event-types/:id/edit → edit mode (pre-fills form)
 * 
 * This shared-form pattern avoids duplicating form logic and UI.
 * Custom questions management is included at the bottom.
 */

import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  getEventType, createEventType, updateEventType,
  getSchedules, addQuestion, deleteQuestion 
} from '../api';
import Toast from '../components/Toast';
import './EventTypeForm.css';

const COLORS = ['#0069ff', '#7b2ff7', '#00a86b', '#ff6b35', '#e63946', '#f4a261', '#2a9d8f', '#264653'];

function EventTypeForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    name: '',
    description: '',
    duration: 30,
    slug: '',
    color: '#0069ff',
    buffer_before: 0,
    buffer_after: 0,
    schedule_id: ''
  });

  const [questions, setQuestions] = useState([]);
  const [newQuestion, setNewQuestion] = useState({ question_text: '', question_type: 'text', is_required: false });
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchSchedules();
    if (isEdit) fetchEventType();
  }, [id]);

  const fetchSchedules = async () => {
    try {
      const { data } = await getSchedules();
      setSchedules(data);
    } catch (error) {
      console.error('Failed to fetch schedules:', error);
    }
  };

  const fetchEventType = async () => {
    try {
      const { data } = await getEventType(id);
      setForm({
        name: data.name,
        description: data.description || '',
        duration: data.duration,
        slug: data.slug,
        color: data.color || '#0069ff',
        buffer_before: data.buffer_before || 0,
        buffer_after: data.buffer_after || 0,
        schedule_id: data.schedule_id || ''
      });
      setQuestions(data.questions || []);
    } catch (error) {
      setToast({ message: 'Failed to load event type', type: 'error' });
    }
  };

  // Auto-generate slug from name
  const handleNameChange = (name) => {
    setForm(prev => ({
      ...prev,
      name,
      slug: isEdit ? prev.slug : name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!form.name.trim()) {
      setToast({ message: 'Event name is required', type: 'error' });
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...form,
        schedule_id: form.schedule_id || null
      };

      if (isEdit) {
        await updateEventType(id, payload);
        setToast({ message: 'Event type updated!', type: 'success' });
      } else {
        await createEventType(payload);
        setToast({ message: 'Event type created!', type: 'success' });
      }

      setTimeout(() => navigate('/'), 1000);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to save event type';
      setToast({ message: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async () => {
    if (!newQuestion.question_text.trim()) return;
    
    if (isEdit) {
      try {
        const { data } = await addQuestion(id, newQuestion);
        setQuestions(prev => [...prev, data]);
        setNewQuestion({ question_text: '', question_type: 'text', is_required: false });
        setToast({ message: 'Question added', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to add question', type: 'error' });
      }
    } else {
      // For new event types, store questions locally (they'll be created after the event type)
      setQuestions(prev => [...prev, { ...newQuestion, id: Date.now(), isNew: true }]);
      setNewQuestion({ question_text: '', question_type: 'text', is_required: false });
    }
  };

  const handleDeleteQuestion = async (questionId, isNew) => {
    if (isNew) {
      setQuestions(prev => prev.filter(q => q.id !== questionId));
    } else {
      try {
        await deleteQuestion(questionId);
        setQuestions(prev => prev.filter(q => q.id !== questionId));
        setToast({ message: 'Question deleted', type: 'success' });
      } catch (error) {
        setToast({ message: 'Failed to delete question', type: 'error' });
      }
    }
  };

  return (
    <div className="form-page">
      <div className="form-page-header">
        <button className="back-link" onClick={() => navigate('/')}>
          ← Back to Event Types
        </button>
        <h1 className="form-page-title">
          {isEdit ? 'Edit Event Type' : 'New Event Type'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="event-form">
        {/* Basic Info Section */}
        <div className="form-section">
          <h3 className="section-title">Event Details</h3>
          
          <div className="form-group">
            <label className="form-label">Event Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., 30 Minute Meeting"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              className="form-input form-textarea"
              placeholder="Add a description for your event..."
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Duration (minutes) *</label>
              <select
                className="form-input"
                value={form.duration}
                onChange={(e) => setForm(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
              >
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
                <option value={120}>120 min</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">URL Slug</label>
              <div className="slug-input-wrapper">
                <span className="slug-prefix">/book/</span>
                <input
                  type="text"
                  className="form-input slug-input"
                  value={form.slug}
                  onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="my-event"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Color</label>
            <div className="color-picker">
              {COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${form.color === color ? 'selected' : ''}`}
                  style={{ background: color }}
                  onClick={() => setForm(prev => ({ ...prev, color }))}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Availability Section */}
        <div className="form-section">
          <h3 className="section-title">Availability</h3>

          <div className="form-group">
            <label className="form-label">Schedule</label>
            <select
              className="form-input"
              value={form.schedule_id}
              onChange={(e) => setForm(prev => ({ ...prev, schedule_id: e.target.value }))}
            >
              <option value="">Use default schedule</option>
              {schedules.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.is_default ? '(default)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Buffer before (min)</label>
              <input
                type="number"
                className="form-input"
                value={form.buffer_before}
                onChange={(e) => setForm(prev => ({ ...prev, buffer_before: parseInt(e.target.value) || 0 }))}
                min={0}
                max={60}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Buffer after (min)</label>
              <input
                type="number"
                className="form-input"
                value={form.buffer_after}
                onChange={(e) => setForm(prev => ({ ...prev, buffer_after: parseInt(e.target.value) || 0 }))}
                min={0}
                max={60}
              />
            </div>
          </div>
        </div>

        {/* Custom Questions Section */}
        <div className="form-section">
          <h3 className="section-title">Custom Questions</h3>
          <p className="section-desc">Add custom questions to collect additional info from invitees.</p>

          {questions.length > 0 && (
            <div className="questions-list">
              {questions.map(q => (
                <div key={q.id} className="question-item">
                  <div className="question-info">
                    <span className="question-text">{q.question_text}</span>
                    <span className="question-meta">
                      {q.question_type} {q.is_required ? '• Required' : '• Optional'}
                    </span>
                  </div>
                  <button 
                    type="button" 
                    className="question-delete"
                    onClick={() => handleDeleteQuestion(q.id, q.isNew)}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="add-question-form">
            <input
              type="text"
              className="form-input"
              placeholder="Enter your question..."
              value={newQuestion.question_text}
              onChange={(e) => setNewQuestion(prev => ({ ...prev, question_text: e.target.value }))}
            />
            <div className="question-options">
              <select
                className="form-input"
                value={newQuestion.question_type}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question_type: e.target.value }))}
              >
                <option value="text">Short text</option>
                <option value="textarea">Long text</option>
                <option value="select">Dropdown</option>
              </select>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newQuestion.is_required}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, is_required: e.target.checked }))}
                />
                Required
              </label>
              <button type="button" className="btn-secondary" onClick={handleAddQuestion}>
                + Add
              </button>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="form-actions">
          <button type="button" className="btn-cancel" onClick={() => navigate('/')}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : (isEdit ? 'Save Changes' : 'Create Event Type')}
          </button>
        </div>
      </form>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

export default EventTypeForm;
