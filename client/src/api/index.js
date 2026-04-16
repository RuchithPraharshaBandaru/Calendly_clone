/**
 * API Service Layer
 * 
 * Centralizes all HTTP requests to the backend using Axios.
 * Each function maps to one API endpoint. This keeps components
 * clean — they call api.getEventTypes() instead of making raw HTTP requests.
 * 
 * Alternative: Using fetch() directly — Axios is preferred because it
 * automatically handles JSON parsing, has better error handling, and
 * supports request/response interceptors.
 */

import axios from 'axios';

// Base URL — in development, Vite proxy forwards /api to localhost:5000
const API = axios.create({
  baseURL: '/api',
  timeout: 10000
});

// ─── Event Types ────────────────────────────────────────────
export const getEventTypes = () => API.get('/event-types');
export const getEventType = (id) => API.get(`/event-types/${id}`);
export const createEventType = (data) => API.post('/event-types', data);
export const updateEventType = (id, data) => API.put(`/event-types/${id}`, data);
export const deleteEventType = (id) => API.delete(`/event-types/${id}`);

// ─── Availability ───────────────────────────────────────────
export const getSchedules = () => API.get('/availability');
export const getSchedule = (id) => API.get(`/availability/${id}`);
export const createSchedule = (data) => API.post('/availability', data);
export const updateSchedule = (id, data) => API.put(`/availability/${id}`, data);
export const addDateOverride = (scheduleId, data) => API.post(`/availability/${scheduleId}/overrides`, data);
export const deleteDateOverride = (id) => API.delete(`/availability/overrides/${id}`);

// ─── Bookings (Public) ─────────────────────────────────────
export const getEventBySlug = (slug) => API.get(`/booking/${slug}`);
export const getAvailableSlots = (slug, date) => API.get(`/booking/${slug}/slots?date=${date}`);
export const bookMeeting = (slug, data) => API.post(`/booking/${slug}`, data);

// ─── Meetings (Admin) ──────────────────────────────────────
export const getMeetings = (filter) => API.get(`/meetings${filter ? `?filter=${filter}` : ''}`);
export const getMeeting = (id) => API.get(`/meetings/${id}`);
export const cancelMeeting = (id, data) => API.put(`/meetings/${id}/cancel`, data);
export const rescheduleMeeting = (id, data) => API.put(`/meetings/${id}/reschedule`, data);

// ─── Custom Questions ──────────────────────────────────────
export const getQuestions = (eventTypeId) => API.get(`/event-types/${eventTypeId}/questions`);
export const addQuestion = (eventTypeId, data) => API.post(`/event-types/${eventTypeId}/questions`, data);
export const updateQuestion = (id, data) => API.put(`/questions/${id}`, data);
export const deleteQuestion = (id) => API.delete(`/questions/${id}`);

export default API;
