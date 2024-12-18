import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./style.module.sass";

export default function Overlay({ overlay, editMode, isActive, layerIsActive, onMouseDown, onOverlayChange }) {
  const { left, top, width, height, type, target, label } = overlay;

  const [dragging, setDragging] = useState({
    isDragging: false,
    initialMouseX: 0,
    initialMouseY: 0,
    initialLeft: 0,
    initialTop: 0,
  });

  const [resizing, setResizing] = useState({
    isResizing: false,
    initialMouseX: 0,
    initialMouseY: 0,
    initialWidth: 0,
    initialHeight: 0,
  });

  const isResizingRef = useRef(false);

  // Handle drag start
  const handleMouseDownDrag = useCallback(
    (e) => {
      if (!editMode) return;
      e.preventDefault();
      setDragging({
        isDragging: true,
        initialMouseX: e.clientX,
        initialMouseY: e.clientY,
        initialLeft: left || 0,
        initialTop: top || 0,
      });
    },
    [editMode, left, top]
  );

  // Handle drag move
  const handleMouseMove = useCallback(
    (e) => {
      if (dragging.isDragging) {
        const parent = document.querySelector("main");
        if (!parent) return;
        const rect = parent.getBoundingClientRect();
        const deltaX = e.clientX - dragging.initialMouseX;
        const deltaY = e.clientY - dragging.initialMouseY;

        // Convert delta to percentage
        const deltaXPercent = (deltaX / rect.width) * 100;
        const deltaYPercent = (deltaY / rect.height) * 100;

        let newLeft = dragging.initialLeft + deltaXPercent;
        let newTop = dragging.initialTop + deltaYPercent;

        // Clamp values between 0 and 100
        newLeft = Math.max(0, Math.min(newLeft, 100 - (width || 10)));
        newTop = Math.max(0, Math.min(newTop, 100 - (height || 10)));

        onOverlayChange({ ...overlay, left: newLeft, top: newTop });
      }
    },
    [dragging, width, height, onOverlayChange, overlay]
  );

  // Handle drag end
  const handleMouseUp = useCallback(() => {
    if (dragging.isDragging) {
      setDragging({
        isDragging: false,
        initialMouseX: 0,
        initialMouseY: 0,
        initialLeft: 0,
        initialTop: 0,
      });
    }
  }, [dragging.isDragging]);

  // Handle resize start
  const handleResizeMouseDown = useCallback(
    (e) => {
      if (!editMode) return;
      e.stopPropagation();
      e.preventDefault();
      isResizingRef.current = true;
      setResizing({
        isResizing: true,
        initialMouseX: e.clientX,
        initialMouseY: e.clientY,
        initialWidth: width || 10,
        initialHeight: height || 10,
      });
    },
    [editMode, width, height]
  );

  // Handle resize move
  const handleResizeMouseMove = useCallback(
    (e) => {
      if (resizing.isResizing) {
        const parent = document.querySelector("main");
        if (!parent) return;

        const rect = parent.getBoundingClientRect();
        const deltaX = e.clientX - resizing.initialMouseX;
        const deltaY = e.clientY - resizing.initialMouseY;

        const deltaXPercent = (deltaX / rect.width) * 100;
        const deltaYPercent = (deltaY / rect.height) * 100;

        let newWidth = resizing.initialWidth + deltaXPercent;
        let newHeight = resizing.initialHeight + deltaYPercent;

        newWidth = Math.max(5, Math.min(newWidth, 100 - (left || 0)));
        newHeight = Math.max(5, Math.min(newHeight, 100 - (top || 0)));

        onOverlayChange({ ...overlay, width: newWidth, height: newHeight });
      }
    },
    [resizing, left, top, onOverlayChange, overlay]
  );

  // Handle resize end
  const handleResizeMouseUp = useCallback(() => {
    if (resizing.isResizing) {
      isResizingRef.current = false;
      setResizing({
        isResizing: false,
        initialMouseX: 0,
        initialMouseY: 0,
        initialWidth: 0,
        initialHeight: 0,
      });
    }
  }, [resizing.isResizing]);

  // Attach global mouse events when dragging or resizing
  useEffect(() => {
    if (dragging.isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }

    if (resizing.isResizing) {
      window.addEventListener("mousemove", handleResizeMouseMove);
      window.addEventListener("mouseup", handleResizeMouseUp);
    } else {
      window.removeEventListener("mousemove", handleResizeMouseMove);
      window.removeEventListener("mouseup", handleResizeMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mousemove", handleResizeMouseMove);
      window.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [
    dragging,
    handleMouseMove,
    handleMouseUp,
    resizing,
    handleResizeMouseMove,
    handleResizeMouseUp,
  ]);

  const handleClick = (e) => {
    if (editMode) {
      e.preventDefault();

      // Dispatch the overlay-select event for external tooling
      const updatedOverlay = {
        ...overlay
      };

      const event = new CustomEvent("overlay-select", { detail: updatedOverlay });
      window.dispatchEvent(event);
    }
  };

  return (
    <div onMouseDown={onMouseDown}>
      <a
        href={target || ""}
        className={(editMode && layerIsActive) ? `${type} ${(isActive) ? styles.active : '' } ${styles.overlay}` : ``}
        
        style={{
          position: "absolute",
          top: `${top}%`,
          left: `${left}%`,
          width: `${width}%`,
          height: `${height}%`,
          cursor: editMode ? "move" : "pointer",
          userSelect: editMode ? "none" : "text",
          boxSizing: "border-box",
          border: editMode ? "1px solid #000" : "none",
        }}

        aria-label="overlay"
        onMouseDown={handleMouseDownDrag}
        onClick={handleClick}
      >
        {editMode && (label || "overlay")}
        {editMode && (
          <div
            className={styles.resizeHandle}
            onMouseDown={handleResizeMouseDown}
          />
        )}
      </a>
    </div>
  );
}