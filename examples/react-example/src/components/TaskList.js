import React from 'react';
import TaskItem from './TaskItem';

const TaskList = ({ tasks, onSetComplete, onRemove, onViewDetails }) => {
  if (tasks.length === 0) {
    return (
      <div className="task-list">
        <div className="empty-state">
          <p>No tasks found. Add some tasks to get started!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map(task => (
        <TaskItem
          key={task.id}
          task={task}
          onSetComplete={(completed) => onSetComplete(task.id, completed)}
          onRemove={() => onRemove(task.id)}
          onViewDetails={() => onViewDetails(task)}
        />
      ))}
    </div>
  );
};

export default TaskList;