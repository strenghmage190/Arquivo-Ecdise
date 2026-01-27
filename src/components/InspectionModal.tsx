import React from 'react';
import './InspectionModal.css';

interface InspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  children: React.ReactNode;
}

const InspectionModal: React.FC<InspectionModalProps> = ({ isOpen, onClose, onSave, children }) => {
  if (!isOpen) return null;

  return (
    <div className="inspection-modal-overlay">
      <div className="inspection-modal-content">
        <div className="modal-header">
          <button onClick={onClose} className="close-btn">&times;</button>
          <button onClick={onSave} className="save-btn">Salvar</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

export default InspectionModal;