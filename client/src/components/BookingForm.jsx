/**
 * BookingForm Component
 * 
 * Form shown after a time slot is confirmed on the public booking page.
 * Collects invitee name, email, and answers to custom questions.
 * 
 * Includes client-side validation for required fields.
 * Custom questions support three types: text, textarea, and select.
 */

import { useState } from 'react';
import './BookingForm.css';

function BookingForm({ eventType, selectedDate, selectedTime, selectedDatetime, onSubmit, onBack, loading }) {
  const [formData, setFormData] = useState({
    invitee_name: '',
    invitee_email: '',
    answers: {}
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error on change
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setFormData(prev => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: value }
    }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.invitee_name.trim()) {
      newErrors.invitee_name = 'Name is required';
    }
    
    if (!formData.invitee_email.trim()) {
      newErrors.invitee_email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.invitee_email)) {
      newErrors.invitee_email = 'Please enter a valid email';
    }

    // Validate required custom questions
    if (eventType.questions) {
      eventType.questions.forEach(q => {
        if (q.is_required && !formData.answers[q.id]?.trim()) {
          newErrors[`question_${q.id}`] = 'This field is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Format answers as array for the API
    const answersArray = Object.entries(formData.answers)
      .filter(([_, value]) => value.trim())
      .map(([questionId, value]) => ({
        question_id: parseInt(questionId),
        answer_text: value
      }));

    onSubmit({
      invitee_name: formData.invitee_name.trim(),
      invitee_email: formData.invitee_email.trim(),
      start_time: selectedDatetime,
      answers: answersArray
    });
  };

  // Format the selected time for display
  const formatSelectedTime = () => {
    const date = new Date(selectedDate);
    const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  return (
    <div className="booking-form">
      <div className="booking-form-header">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>
        <div className="booking-summary">
          <div className="summary-color" style={{ background: eventType.color || '#0069ff' }}></div>
          <div>
            <h3 className="summary-name">{eventType.name}</h3>
            <p className="summary-detail">🕐 {eventType.duration} min</p>
            <p className="summary-detail">📅 {formatSelectedTime()}</p>
            <p className="summary-detail">🕑 {selectedTime}</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="booking-form-fields">
        <h3 className="form-title">Enter Details</h3>

        <div className="form-group">
          <label className="form-label">Name *</label>
          <input
            type="text"
            className={`form-input ${errors.invitee_name ? 'input-error' : ''}`}
            placeholder="Your full name"
            value={formData.invitee_name}
            onChange={(e) => handleChange('invitee_name', e.target.value)}
          />
          {errors.invitee_name && <span className="error-text">{errors.invitee_name}</span>}
        </div>

        <div className="form-group">
          <label className="form-label">Email *</label>
          <input
            type="email"
            className={`form-input ${errors.invitee_email ? 'input-error' : ''}`}
            placeholder="your@email.com"
            value={formData.invitee_email}
            onChange={(e) => handleChange('invitee_email', e.target.value)}
          />
          {errors.invitee_email && <span className="error-text">{errors.invitee_email}</span>}
        </div>

        {/* Custom Questions */}
        {eventType.questions && eventType.questions.map(question => (
          <div key={question.id} className="form-group">
            <label className="form-label">
              {question.question_text} {question.is_required ? '*' : ''}
            </label>
            
            {question.question_type === 'textarea' ? (
              <textarea
                className={`form-input form-textarea ${errors[`question_${question.id}`] ? 'input-error' : ''}`}
                placeholder="Type your answer..."
                value={formData.answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                rows={3}
              />
            ) : question.question_type === 'select' ? (
              <select
                className={`form-input form-select ${errors[`question_${question.id}`] ? 'input-error' : ''}`}
                value={formData.answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              >
                <option value="">Select an option</option>
                {(() => {
                  try {
                    const opts = typeof question.options === 'string' 
                      ? JSON.parse(question.options) 
                      : question.options;
                    return opts?.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ));
                  } catch { return null; }
                })()}
              </select>
            ) : (
              <input
                type="text"
                className={`form-input ${errors[`question_${question.id}`] ? 'input-error' : ''}`}
                placeholder="Type your answer..."
                value={formData.answers[question.id] || ''}
                onChange={(e) => handleAnswerChange(question.id, e.target.value)}
              />
            )}
            
            {errors[`question_${question.id}`] && (
              <span className="error-text">{errors[`question_${question.id}`]}</span>
            )}
          </div>
        ))}

        <button type="submit" className="submit-button" disabled={loading}>
          {loading ? 'Scheduling...' : 'Schedule Event'}
        </button>
      </form>
    </div>
  );
}

export default BookingForm;
