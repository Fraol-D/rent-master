import React from 'react';

interface ConfirmDialogProps {
  message: string;
  options: {
    title?: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'info' | 'warning' | 'danger';
  };
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  message,
  options,
  onConfirm,
  onCancel,
}) => {
  const {
    title = 'Confirm Action',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info'
  } = options;

  return (
    <div className="confirm-overlay">
      <div className="confirm-dialog">
        <div className={`confirm-header ${type}`}>
          <h3>{title}</h3>
        </div>
        <div className="confirm-content">
          <p>{message}</p>
        </div>
        <div className="confirm-actions">
          <button 
            className="cancel-button" 
            onClick={onCancel}
          >
            {cancelText}
          </button>
          <button 
            className={`confirm-button ${type}`} 
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;