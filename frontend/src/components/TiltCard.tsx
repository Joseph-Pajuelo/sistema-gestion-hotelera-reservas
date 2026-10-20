import React, { useRef, type PointerEvent, type ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Grados máximos de inclinación 3D */
  max?: number;
  /** Delay de entrada escalonada en segundos */
  delay?: number;
  /** Variante cálida de verano/mar (ocean, sun, coral) */
  glowColor?: 'ocean' | 'sun' | 'coral';
}

const GLOW_PALETTE = {
  ocean: {
    border: 'rgba(13, 148, 136, 0.65)',
    spot: 'rgba(20, 184, 166, 0.12)'
  },
  sun: {
    border: 'rgba(245, 158, 11, 0.72)',
    spot: 'rgba(251, 191, 36, 0.15)'
  },
  coral: {
    border: 'rgba(234, 88, 12, 0.65)',
    spot: 'rgba(249, 115, 22, 0.12)'
  }
};

/**
 * Tarjeta 3D con seguimiento de puntero y estética cálida de verano / mar:
 * - Inclinación 3D suave (rotateX / rotateY) mediante variables CSS sin re-renderizar React
 * - Borde luminoso radial (maskComposite: exclude) + Spotlight solar/marino interno
 * - Animación de entrada con @starting-style y curva exponencial (--ease-expo)
 */
export function TiltCard({
  children,
  className = '',
  max = 5.5,
  delay = 0,
  glowColor = 'ocean'
}: TiltCardProps) {
  const ref = useRef<HTMLElement>(null);
  const colors = GLOW_PALETTE[glowColor];

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    el.style.setProperty('--mx', `${(px * 100).toFixed(2)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(2)}%`);

    if (e.pointerType === 'mouse' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const ry = ((px - 0.5) * max * 2).toFixed(2);
      const rx = ((0.5 - py) * max * 2).toFixed(2);
      el.style.setProperty('--rx', `${rx}deg`);
      el.style.setProperty('--ry', `${ry}deg`);
    }
  };

  const onPointerLeave = () => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };

  return (
    <article
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      style={
        {
          '--card-delay': `${delay}s`,
          '--glow-border': colors.border,
          '--glow-spot': colors.spot
        } as React.CSSProperties
      }
      className={`tilt-card ${className}`}
    >
      {/* Resplandor de borde radial que sigue al cursor */}
      <div aria-hidden="true" className="tilt-card-border" />
      {/* Spotlight radial de fondo */}
      <div aria-hidden="true" className="tilt-card-spotlight" />
      <div className="tilt-card-inner">{children}</div>
    </article>
  );
}

interface CardHeadProps {
  index: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  rightSlot?: ReactNode;
}

export function CardHead({ index, title, subtitle, icon: Icon, rightSlot }: CardHeadProps) {
  return (
    <div className="card-head">
      <div>
        <p className="card-head-index">RESORT // {index}</p>
        <h3 className="card-head-title">{title}</h3>
        {subtitle && <p className="card-head-subtitle">{subtitle}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {rightSlot}
        {Icon && (
          <span className="card-head-icon" aria-hidden="true">
            <Icon size={17} strokeWidth={1.7} />
          </span>
        )}
      </div>
    </div>
  );
}
