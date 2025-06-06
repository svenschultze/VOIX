import React, { useState, useCallback, useRef, useEffect } from 'react';

const TaskDetailsModal = ({ task, onClose, onUpdate }) => {
  const [editedTask, setEditedTask] = useState({ ...task });
  const setTextToolRef = useRef(null);
  const setDueDateToolRef = useRef(null);
  const setPriorityToolRef = useRef(null);
  const setNotesToolRef = useRef(null);

  // Update edited task when task prop changes
  useEffect(() => {
    if (task) {
      setEditedTask({ ...task });
    }
  }, [task]);

  const handleSave = useCallback(() => {
    onUpdate({ ...editedTask });
    onClose();
  }, [editedTask, onUpdate, onClose]);
// VOIX Tool handlers
const handleSetText = useCallback((event) => {
    const { text } = event.detail;
    if (text && text.trim()) {
        setEditedTask(prev => ({ ...prev, text }));
        event.detail.success = true;
        event.detail.message = `Task text updated to "${text}"`;
    } else {
        event.detail.success = false;
        event.detail.error = "Text cannot be empty";
    }
}, []);

const handleSetDueDate = useCallback((event) => {
    const { dueDate } = event.detail;
    if (!dueDate || /^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
        setEditedTask(prev => ({ ...prev, dueDate }));
        event.detail.success = true;
        event.detail.message = `Due date set to ${dueDate || 'none'}`;
    } else {
        event.detail.success = false;
        event.detail.error = "Invalid date format. Use YYYY-MM-DD";
    }
}, []);

const handleSetPriority = useCallback((event) => {
    const { priority } = event.detail;
    if (['low', 'medium', 'high'].includes(priority)) {
        setEditedTask(prev => ({ ...prev, priority }));
        event.detail.success = true;
        event.detail.message = `Priority changed to ${priority}`;
    } else {
        event.detail.success = false;
        event.detail.error = "Priority must be low, medium, or high";
    }
}, []);

const handleSetNotes = useCallback((event) => {
    const { notes } = event.detail;
    setEditedTask(prev => ({ ...prev, notes: notes || '' }));
    event.detail.success = true;
    event.detail.message = "Notes updated successfully";
}, []);

  // Set up VOIX tool event listeners
  useEffect(() => {
    const setTextEl = setTextToolRef.current;
    const setDueDateEl = setDueDateToolRef.current;
    const setPriorityEl = setPriorityToolRef.current;
    const setNotesEl = setNotesToolRef.current;

    if (setTextEl) {
      setTextEl.addEventListener('call', handleSetText);
    }
    if (setDueDateEl) {
      setDueDateEl.addEventListener('call', handleSetDueDate);
    }
    if (setPriorityEl) {
      setPriorityEl.addEventListener('call', handleSetPriority);
    }
    if (setNotesEl) {
      setNotesEl.addEventListener('call', handleSetNotes);
    }

    return () => {
      if (setTextEl) {
        setTextEl.removeEventListener('call', handleSetText);
      }
      if (setDueDateEl) {
        setDueDateEl.removeEventListener('call', handleSetDueDate);
      }
      if (setPriorityEl) {
        setPriorityEl.removeEventListener('call', handleSetPriority);
      }
      if (setNotesEl) {
        setNotesEl.removeEventListener('call', handleSetNotes);
      }
    };
  }, [handleSetText, handleSetDueDate, handleSetPriority, handleSetNotes]);

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    handleSave();
  }, [handleSave]);

  const handleOverlayClick = useCallback((event) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!task) return null;

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Task Details</h2>
          <button 
            onClick={onClose}
            className="close-button"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="task-text">Task</label>
            <input 
              id="task-text"
              value={editedTask.text}
              onChange={(e) => setEditedTask(prev => ({ ...prev, text: e.target.value }))}
              type="text" 
              required 
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="due-date">Due Date</label>
            <input 
              id="due-date"
              value={editedTask.dueDate || ''}
              onChange={(e) => setEditedTask(prev => ({ ...prev, dueDate: e.target.value }))}
              type="date" 
              className="form-input"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select 
              id="priority"
              value={editedTask.priority || 'medium'}
              onChange={(e) => setEditedTask(prev => ({ ...prev, priority: e.target.value }))}
              className="form-select"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea 
              id="notes"
              value={editedTask.notes || ''}
              onChange={(e) => setEditedTask(prev => ({ ...prev, notes: e.target.value }))}
              rows="3"
              placeholder="Add any additional notes here..."
              className="form-textarea"
            />
          </div>
          
          <div className="button-group">
            <button type="button" onClick={onClose} className="button button-secondary">
              Cancel
            </button>
            <button type="submit" className="button button-primary">
              Save Changes
            </button>
          </div>
        </form>

        {/* Context for current editing state */}
        <context name="current_task">
          You are currently editing task {task.id}:
          - Text: {task.text}
          - Due date: {task.dueDate || 'none'}
          - Priority: {task.priority || 'medium'}
          - Notes: {task.notes || 'none'}
        </context>
        
        {/* VOIX Tools for AI to edit individual fields */}
        <tool 
          ref={setTextToolRef}
          name="set_text" 
          description="Set the task text"
        >
          <prop name="text" type="string" description={`New text (currently: ${editedTask.text})`}>
            {editedTask.text}
          </prop>
        </tool>
        
        <tool 
          ref={setDueDateToolRef}
          name="set_due_date" 
          description="Set the due date"
        >
          <prop name="dueDate" type="string" description="Due date in YYYY-MM-DD format">
            {editedTask.dueDate || ''}
          </prop>
        </tool>
        
        <tool 
          ref={setPriorityToolRef}
          name="set_priority" 
          description="Set the priority level"
        >
          <prop name="priority" type="string" description="Priority: low, medium, or high">
            {editedTask.priority || 'medium'}
          </prop>
        </tool>
        
        <tool 
          ref={setNotesToolRef}
          name="set_notes" 
          description="Set task notes"
        >
          <prop name="notes" type="string" description="Task notes or additional information">
            {editedTask.notes || ''}
          </prop>
        </tool>
      </div>
    </div>
  );
};

export default TaskDetailsModal;