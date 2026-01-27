import React from 'react';
import './EvidenceCard.css';

interface EvidenceCardProps {
  title: string;
  description: string;
  onEdit: () => void;
  onDelete: () => void;
  onConnect: () => void;
}

const EvidenceCard: React.FC<EvidenceCardProps> = ({ title, description, onEdit, onDelete, onConnect }) => {
  return (
    <div className="evidence-card">
      <div className="card-header">
        <h3>{title}</h3>
        <button onClick={onEdit} className="card-action-btn">✏️</button>
      </div>
      <div className="card-content">
        <p>{description}</p>
      </div>
      <div className="card-actions">
        <button onClick={onConnect} className="card-action-btn">🔗</button>
        <button onClick={onDelete} className="card-action-btn">🗑️</button>
      </div>
    </div>
  );
};

export default EvidenceCard;