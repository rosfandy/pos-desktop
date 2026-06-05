import { useEffect, useCallback } from 'react';
import { useCartStore } from '@/stores/cartStore';

type KeyHandler = (e: KeyboardEvent) => void;

// ─── Hook ─────────────────────────────────────────────────────────────────────

export default function useKeyboardShortcuts() {

  const focusSearch = useCallback(() => {
    const searchInput = document.querySelector<HTMLInputElement>('[data-focus-search="product"]');
    searchInput?.focus();
  }, []);

  const openPayment = useCallback(() => {
    // Dispatch custom event that PaymentModal listens to
    window.dispatchEvent(new CustomEvent('pos:open-payment'));
  }, []);

  const holdBill = useCallback(async () => {
    await useCartStore.getState().holdBill();
  }, []);

  const loadHeldBill = useCallback(() => {
    window.dispatchEvent(new CustomEvent('pos:open-held-bills'));
  }, []);

  const reprintLast = useCallback(() => {
    window.dispatchEvent(new CustomEvent('pos:reprint-last'));
  }, []);

  const closeModal = useCallback(() => {
    window.dispatchEvent(new CustomEvent('pos:close-modal'));
  }, []);

  const adjustQty = useCallback((delta: number) => {
    // Find first focused cart item
    const focused = document.querySelector<HTMLElement>('[data-cart-item-product-id]:focus');
    if (focused) {
      const productId = focused.dataset.cartItemProductId!;
      const unit = focused.dataset.cartItemUnit || 'pcs';
      const currentQty = parseInt(focused.dataset.cartItemQty || '1', 10);
      useCartStore.getState().updateQuantity(productId, unit, currentQty + delta);
    }
  }, []);

  const removeSelected = useCallback(() => {
    const focused = document.querySelector<HTMLElement>('[data-cart-item-product-id]:focus');
    if (focused) {
      const productId = focused.dataset.cartItemProductId!;
      const unit = focused.dataset.cartItemUnit || 'pcs';
      useCartStore.getState().removeItem(productId, unit);
    }
  }, []);

  useEffect(() => {
    const handlers: Record<string, KeyHandler> = {
      F2: focusSearch,
      f: focusSearch, // Ctrl+F
      F5: holdBill,
      F6: loadHeldBill,
      F7: reprintLast,
      Escape: closeModal,
      '+': () => adjustQty(1),
      '=': () => adjustQty(1), // + without shift
      '-': () => adjustQty(-1),
      '_': () => adjustQty(-1), // - with shift
      ArrowLeft: () => adjustQty(-1),
      ArrowRight: () => adjustQty(1),
      Delete: removeSelected,
      Backspace: removeSelected,
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Jika sudah di-handle oleh modal (misal PaymentModal), skip
      if (e.defaultPrevented) return;

      // Ctrl+Enter / Cmd+Enter to open payment
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        openPayment();
        return;
      }

      // Ignore if typing in input
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;

      // Ctrl+F / Cmd+F should still focus search
      if (e.key === 'f' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        focusSearch();
        return;
      }

      // Skip if typing in input field (except Escape, +/- when cart item focused)
      if (isInput && !['Escape', '+', '=', '-', '_'].includes(e.key)) {
        return;
      }

      const handler = handlers[e.key];
      if (handler) {
        e.preventDefault();
        handler(e);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusSearch, openPayment, holdBill, loadHeldBill, reprintLast, closeModal, adjustQty, removeSelected]);
}
