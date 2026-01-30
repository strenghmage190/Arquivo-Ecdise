import React from 'react';

interface NPCProps {
  id?: string;
  name: string;
  avatarUrl?: string;
  role?: string;
  bio?: string;
  onInteract?: (id?: string) => void;
}

export default function NPC({ id, name, avatarUrl, role, bio, onInteract }: NPCProps) {
  return (
    <div className="npc-card" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: 8, background: '#111', color: '#fff', borderRadius: 8, border: '1px solid #222' }}>
      <div style={{ width: 72, height: 72, borderRadius: 6, background: '#222', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {avatarUrl ? (
          // eslint-disable-next-line jsx-a11y/img-redundant-alt
          <img src={avatarUrl} alt={`avatar ${name}`} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc' }}>{name?.charAt?.(0) ?? '?'}</div>
        )}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <div>
            <div style={{ fontWeight: 700 }}>{name}</div>
            {role && <div style={{ fontSize: 12, color: '#aaa' }}>{role}</div>}
          </div>
          <div>
            <button onClick={() => onInteract?.(id)} style={{ background: '#2b6', border: 'none', padding: '6px 8px', borderRadius: 6, cursor: 'pointer' }}>Interagir</button>
          </div>
        </div>
        {bio && <div style={{ marginTop: 8, color: '#ddd', fontSize: 13 }}>{bio}</div>}
      </div>
    </div>
  );
}
