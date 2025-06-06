import React, { useCallback, useRef, useEffect } from 'react';

const TaskItem = ({ task, onSetComplete, onRemove, onViewDetails }) => {
  const completeToolRef = useRef(null);
  const removeToolRef = useRef(null);
  const viewDetailsToolRef = useRef(null);

  // VOIX Tool handlers
  const handleCompleteTask = useCallback((event) => {
    const { completed } = event.detail;
    onSetComplete(completed);
    
    event.detail.success = true;
    event.detail.message = `Task marked as ${completed ? 'completed' : 'incomplete'}`;
  }, [onSetComplete]);

  const handleRemoveTask = useCallback((event) => {
    onRemove();
    
    event.detail.success = true;
    event.detail.message = `Task "${task.text}" removed`;
  }, [onRemove, task.text]);

  const handleViewDetails = useCallback((event) => {
    onViewDetails();
    
    event.detail.success = true;
    event.detail.message = `Opened details for task "${task.text}"`;
  }, [onViewDetails, task.text]);

  // Set up VOIX tool event listeners
  useEffect(() => {
    const completeToolEl = completeToolRef.current;
    const removeToolEl = removeToolRef.current;
    const viewDetailsToolEl = viewDetailsToolRef.current;

    if (completeToolEl) {
      completeToolEl.addEventListener('call', handleCompleteTask);
    }
    if (removeToolEl) {
      removeToolEl.addEventListener('call', handleRemoveTask);
    }
    if (viewDetailsToolEl) {
      viewDetailsToolEl.addEventListener('call', handleViewDetails);
    }

    return () => {
      if (completeToolEl) {
        completeToolEl.removeEventListener('call', handleCompleteTask);
      }
      if (removeToolEl) {
        removeToolEl.removeEventListener('call', handleRemoveTask);
      }
      if (viewDetailsToolEl) {
        viewDetailsToolEl.removeEventListener('call', handleViewDetails);
      }
    };
  }, [handleCompleteTask, handleRemoveTask, handleViewDetails]);

  const priorityColor = {
    high: '#ff6b6b',
    medium: '#feca57',
    low: '#48dbfb'
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays === -1) return 'Yesterday';
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`;
    if (diffDays < 7) return `In ${diffDays} days`;
    
    return date.toLocaleDateString();
  };

  return (
    <div className={`task-item ${task.completed ? 'completed' : ''}`}>
      <div className="task-content">
        <div className="task-checkbox-container">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={(e) => onSetComplete(e.target.checked)}
            className="task-checkbox"
            aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
          />
        </div>
        
        <div className="task-details">
          <div className="task-text">{task.text}</div>
          
          <div className="task-meta">
            <span 
              className="priority-badge" 
              style={{ backgroundColor: priorityColor[task.priority] }}
            >
              {task.priority}
            </span>
            
            {task.dueDate && (
              <span className={`due-date ${new Date(task.dueDate) < new Date() && !task.completed ? 'overdue' : ''}`}>
                Due: {formatDate(task.dueDate)}
              </span>
            )}
            
            {task.notes && (
              <span className="notes-indicator" title={task.notes}>
                📝 Notes
              </span>
            )}
          </div>
        </div>
      </div>
      
      <div className="task-actions">
        <button 
          onClick={onViewDetails}
          className="action-button details-button"
          title="View details"
        >
          ✏️
        </button>
        
        <button 
          onClick={onRemove}
          className="action-button remove-button"
          title="Remove task"
        >
          🗑️
        </button>
      </div>

      {/* VOIX Tools for this specific task */}
      <tool 
        ref={completeToolRef}
        name={`complete_task_${task.id}`}
        description={`Mark '${task.text}' as complete`}
      >
        <prop name="completed" type="boolean" description="Mark as completed" required>
          {!task.completed}
        </prop>
      </tool>
      
      <tool 
        ref={removeToolRef}
        name={`remove_task_${task.id}`}
        description={`Remove '${task.text}' from the list`}
      />
      
      <tool 
        ref={viewDetailsToolRef}
        name={`view_details_${task.id}`}
        description={`View details for '${task.text}'`}
      />
    </div>
  );
};

export default TaskItem;