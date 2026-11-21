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
  const [imageLoaded, setImageLoaded] = React.useState(false);

  return (
    <div
      className="npc-card"
      style={{
        display: 'flex',
        gap: 'var(--space-3)',
        alignItems: 'flex-start',
        padding: 'var(--space-2)',
        background: 'var(--surface)',
        color: 'var(--text-primary)',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          aspectRatio: '1 / 1',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(255, 255, 255, 0.05)',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {avatarUrl ? (
          <>
            {!imageLoaded && (
              <div
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(90deg, rgba(255,255,255,0.02) 25%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.02) 75%)',
                  backgroundSize: '200% 100%',
                  animation: 'pulse 1.5s infinite',
                }}
              />
            )}
            <img
              src={avatarUrl}
              alt={`Avatar de ${name}`}
              loading="lazy"
              width={72}
              height={72}
              onLoad={() => setImageLoaded(true)}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                opacity: imageLoaded ? 1 : 0,
                transition: 'opacity 0.2s ease',
              }}
            />
          </>
        ) : (
          <div
            aria-hidden="true"
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)',
              fontWeight: 700,
              fontSize: 'var(--font-size-lg)',
            }}
          >
            {name?.charAt?.(0) ?? '?'}
          </div>
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 'var(--space-2)' }}>
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: 'var(--font-size-base)',
                color: 'var(--text-primary)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              title={name}
            >
              {name}
            </div>
            {role && (
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--text-secondary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={role}
              >
                {role}
              </div>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => onInteract?.(id)}
              className="btn-ordo btn-ordo-primary control-sm"
              aria-label={`Interagir com ${name}`}
            >
              Interagir
            </button>
          </div>
        </div>
        {bio && (
          <div
            style={{
              marginTop: 'var(--space-2)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--font-size-sm)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={bio}
            aria-label={bio}
          >
            {bio}
          </div>
        )}
      </div>
    </div>
  );
}
