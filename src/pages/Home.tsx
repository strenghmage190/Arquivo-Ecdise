import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getInvestigations } from '../api';

export default function Home() {
  const [investigations, setInvestigations] = useState<any[]>([]);

  useEffect(() => {
    getInvestigations().then(setInvestigations).catch(console.error);
  }, []);

  return (
    <div className="container">
      <h1>Investigações</h1>
      <p>Selecione um caso para abrir o mapa mental.</p>
      <ul>
        {investigations.map((inv) => (
          <li key={inv.id}>
            <strong>{inv.title}</strong>
            <div>{inv.description}</div>
            <Link to={`/investigation/${inv.id}`}>Abrir</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
