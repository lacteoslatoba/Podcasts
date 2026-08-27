import { useRef } from 'react';
import { Platform, ScrollView } from 'react-native';

/**
 * Permite arrastrar con el clic del mouse las filas horizontales estilo
 * Netflix en web (desktop). Un <ScrollView horizontal> normal solo responde
 * a scroll táctil o rueda/trackpad — en PC, sin esto, arrastrar con el mouse
 * no mueve la fila (es el comportamiento nativo del navegador, no un bug de
 * la app, pero tampoco es lo que un usuario de escritorio espera).
 *
 * Uso:
 *   const { scrollRef, bind, onScroll, wasDragged } = useDragScroll();
 *   <ScrollView ref={scrollRef} horizontal onScroll={onScroll} scrollEventThrottle={16} {...bind}>
 *     <TouchableOpacity onPress={() => { if (!wasDragged()) onPress(item); }}>...
 */
export function useDragScroll() {
  const scrollRef = useRef<ScrollView>(null);
  const state = useRef({ dragging: false, startX: 0, startScroll: 0, currentScroll: 0, moved: false });

  const onScroll = (e: any) => {
    state.current.currentScroll = e.nativeEvent?.contentOffset?.x ?? state.current.currentScroll;
  };

  const isWeb = Platform.OS === 'web';

  const bind: Record<string, any> = isWeb
    ? {
        onMouseDown: (e: any) => {
          state.current.dragging = true;
          state.current.moved = false;
          state.current.startX = e.nativeEvent?.clientX ?? 0;
          state.current.startScroll = state.current.currentScroll;
        },
        onMouseMove: (e: any) => {
          if (!state.current.dragging) return;
          const clientX = e.nativeEvent?.clientX ?? 0;
          const dx = clientX - state.current.startX;
          if (Math.abs(dx) > 4) state.current.moved = true;
          scrollRef.current?.scrollTo({ x: state.current.startScroll - dx, animated: false });
        },
        onMouseUp: () => {
          state.current.dragging = false;
        },
        onMouseLeave: () => {
          state.current.dragging = false;
        },
      }
    : {};

  /** true si el último gesto fue un arrastre (para no disparar onPress al soltar) */
  const wasDragged = () => state.current.moved;

  return { scrollRef, bind, onScroll, wasDragged };
}
