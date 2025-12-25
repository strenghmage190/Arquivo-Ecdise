import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getInvestigationById } from '../api';
import { InvestigationBoard } from '../components/board/InvestigationBoard';

export default function Investigation() {
  const { id } = useParams();
  const [investigation, setInvestigation] = useState<any | null>(null);

  useEffect(() => {
    if (id) getInvestigationById(id).then(setInvestigation).catch(console.error);
  }, [id]);

  if (!investigation) return <div className="container">Carregando investigação...</div>;

  return (
    <div className="container">
      <h1>{investigation.title}</h1>
      <p>{investigation.description}</p>
      <InvestigationBoard investigationId={id as string} />
    </div>
  );
}
