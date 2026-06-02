import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Page / Layout ────────────────────────────────────────────────────────────

export function PosPage({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-page', className)} {...props} />;
}

export function PosPageColumn({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-page-col', className)} {...props} />;
}

export function PosToolbar({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-toolbar', className)} {...props} />;
}

export function PosToolbarTitle({ className, ...props }: React.ComponentProps<'span'>) {
  return <span className={cn('pos-toolbar-title', className)} {...props} />;
}

export function PosPanel({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-panel', className)} {...props} />;
}

export function PosPanelFlush({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-panel-flush', className)} {...props} />;
}

export function PosPanelBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-panel-body', className)} {...props} />;
}

// ── Sidebar menu ─────────────────────────────────────────────────────────────

export function PosSideMenu({ className, ...props }: React.ComponentProps<'aside'>) {
  return <aside className={cn('pos-sidebar', className)} {...props} />;
}

export function PosSideMenuHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-sidebar-header', className)} {...props} />;
}

export function PosSideMenuNav({ className, ...props }: React.ComponentProps<'nav'>) {
  return <nav className={cn('pos-sidebar-nav', className)} {...props} />;
}

export function PosSideMenuItem({
  active,
  className,
  ...props
}: React.ComponentProps<'button'> & { active?: boolean }) {
  return (
    <button
      type="button"
      className={cn('pos-sidebar-item', active && 'pos-sidebar-item-active', className)}
      {...props}
    />
  );
}

// ── Form ─────────────────────────────────────────────────────────────────────

export function PosForm({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-form', className)} {...props} />;
}

export function PosFormSection({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-form-section', className)} {...props} />;
}

export function PosFormActions({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-form-row', className)} {...props} />;
}

export function PosLabel({ className, tone = 'default', ...props }: React.ComponentProps<'label'> & { tone?: 'default' | 'danger' | 'success' | 'info' }) {
  return (
    <label
      className={cn(
        tone === 'danger' && 'pos-label-danger',
        tone === 'success' && 'pos-label-success',
        tone === 'info' && 'pos-label-info',
        tone === 'default' && 'pos-label',
        className,
      )}
      {...props}
    />
  );
}

export function PosHint({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('pos-hint', className)} {...props} />;
}

// ── Buttons ──────────────────────────────────────────────────────────────────

export function PosButton({
  variant = 'secondary',
  className,
  ...props
}: React.ComponentProps<'button'> & { variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'ghost' }) {
  const variantClass = {
    primary: 'pos-btn-primary',
    secondary: 'pos-btn-secondary',
    success: 'pos-btn-success',
    warning: 'pos-btn-warning',
    danger: 'pos-btn-danger',
    ghost: 'pos-btn-ghost',
  }[variant];

  return <button type="button" className={cn(variantClass, className)} {...props} />;
}

// ── Feedback / Empty ─────────────────────────────────────────────────────────

export function PosEmptyState({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('pos-empty', className)} {...props} />;
}

export function PosEmptyTitle({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('pos-empty-title', className)} {...props} />;
}

export function PosEmptyDescription({ className, ...props }: React.ComponentProps<'p'>) {
  return <p className={cn('pos-empty-desc', className)} {...props} />;
}

export function PosAlert({
  tone = 'info',
  className,
  ...props
}: React.ComponentProps<'div'> & { tone?: 'info' | 'success' | 'error' }) {
  return (
    <div
      className={cn(
        tone === 'info' && 'pos-form-info',
        tone === 'success' && 'pos-form-success',
        tone === 'error' && 'pos-form-error',
        className,
      )}
      {...props}
    />
  );
}
