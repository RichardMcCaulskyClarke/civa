// Editor.jsx
import { useState, useEffect, useCallback } from "react";
import styles from "./style.module.sass";
import Layer from "../Layer/Editor";
import Overlay from "../Overlay/Editor";

export default function Editor({ initialSlide, presentation }) {
    const DEFAULT_LAYER_ID = 'default';
    const DEFAULT_LAYER_LEVEL = 1;

    const [slide, setSlide] = useState(() => {
        const clonedSlide = JSON.parse(JSON.stringify(initialSlide));

        if (!clonedSlide.layers || clonedSlide.layers.length === 0) {
            clonedSlide.layers = [{
                uid: crypto.randomUUID(),
                id: DEFAULT_LAYER_ID,
                level: DEFAULT_LAYER_LEVEL,
                overlays: []
            }];
        }

        clonedSlide.layers.forEach(layer => {
            if (!layer.overlays) layer.overlays = [];
            layer.overlays = layer.overlays.map(ov => ({
                ...ov,
                uid: ov.uid || crypto.randomUUID()
            }));
        });

        return clonedSlide;
    });

    const [selectedLayerIndex, setLayerIndex] = useState(0);
    const [selectedOverlayIndex, setOverlayIndex] = useState(null);

    const addLayer = useCallback((layer) => {
        const newLayer = {
            uid: crypto.randomUUID(),
            id: `layer-${slide.layers.length + 1}`,
            level: slide.layers.length + 1,
            image: null,
            overlays: [],
            ...layer
        };

        setSlide(prevSlide => ({
            ...prevSlide,
            layers: [...prevSlide.layers, newLayer]
        }));

        // Select the newly added layer
        setLayerIndex(slide.layers.length);
        setOverlayIndex(null);
    }, [slide.layers.length]);

    const addOverlay = useCallback((layerIndex) => {
        const newOverlay = {
            uid: crypto.randomUUID(),
            type: 'hotspot',
            left: 45,
            top: 47.5,
            width: 10,
            height: 5,
            target: '',
            class: ''
        };

        setSlide(prevSlide => {
            const updatedLayers = [...prevSlide.layers];
            const layer = { ...updatedLayers[layerIndex] };
            layer.overlays = [...layer.overlays, newOverlay];
            updatedLayers[layerIndex] = layer;
            return { ...prevSlide, layers: updatedLayers };
        });

        setLayerIndex(layerIndex);
        // Set overlay selection after state updates:
        // We'll rely on useEffect to ensure this is stable.
        setOverlayIndex({ layerIndex, overlayIndex: slide.layers[layerIndex].overlays.length });
    }, [slide.layers]);

    const removeOverlay = useCallback((layerIndex, overlayIndex) => {
        setSlide(prevSlide => {
            const updatedLayers = [...prevSlide.layers];
            const layer = { ...updatedLayers[layerIndex] };
            layer.overlays = layer.overlays.filter((_, idx) => idx !== overlayIndex);
            updatedLayers[layerIndex] = layer;
            return { ...prevSlide, layers: updatedLayers };
        });
        // Overlay selection adjustments happen after state update in useEffect
    }, []);

    const removeLayer = useCallback((layerIndex) => {
        setSlide(prevSlide => {
            if (layerIndex === 0) {
                console.warn("Cannot remove the first layer.");
                return prevSlide;
            }
            if (prevSlide.layers.length <= 1) {
                console.warn("At least one layer must remain.");
                return prevSlide;
            }

            const updatedLayers = prevSlide.layers.filter((_, idx) => idx !== layerIndex);
            let newLayerIndex = selectedLayerIndex;
            if (selectedLayerIndex === layerIndex) {
                newLayerIndex = layerIndex > 0 ? layerIndex - 1 : 0;
            } else if (selectedLayerIndex > layerIndex) {
                newLayerIndex = selectedLayerIndex - 1;
            }

            // Adjust overlay selection
            if (selectedOverlayIndex) {
                if (selectedOverlayIndex.layerIndex === layerIndex) {
                    const remainingOverlays = updatedLayers[newLayerIndex].overlays;
                    if (remainingOverlays.length > 0) {
                        setOverlayIndex({ layerIndex: newLayerIndex, overlayIndex: 0 });
                    } else {
                        setOverlayIndex(null);
                    }
                } else if (selectedOverlayIndex.layerIndex > layerIndex) {
                    setOverlayIndex(prev => ({
                        ...prev,
                        layerIndex: prev.layerIndex - 1
                    }));
                }
            }

            setLayerIndex(newLayerIndex);
            return { ...prevSlide, layers: updatedLayers };
        });
    }, [selectedLayerIndex, selectedOverlayIndex]);

    const updateOverlay = useCallback((layerIndex, overlayIndex, updatedOverlay) => {
        setSlide(prevSlide => {
            const updatedLayers = [...prevSlide.layers];
            const layer = { ...updatedLayers[layerIndex] };
            layer.overlays = layer.overlays.map((ov, i) => i === overlayIndex ? { ...ov, ...updatedOverlay } : ov);
            updatedLayers[layerIndex] = layer;
            return { ...prevSlide, layers: updatedLayers };
        });
    }, []);

    const handleOverlaySelect = useCallback((layerIndex, overlayIndex) => {
        setLayerIndex(layerIndex);
        setOverlayIndex({ layerIndex, overlayIndex });
    }, []);

    useEffect(() => {
        // Validate selected overlay
        if (selectedOverlayIndex) {
            const { layerIndex, overlayIndex } = selectedOverlayIndex;
            const layer = slide.layers[layerIndex];

            if (!layer) {
                setOverlayIndex(null);
            } else if (!layer.overlays[overlayIndex]) {
                if (layer.overlays.length > 0) {
                    const newOverlayIndex = Math.min(overlayIndex, layer.overlays.length - 1);
                    setOverlayIndex({ layerIndex, overlayIndex: newOverlayIndex });
                } else {
                    setOverlayIndex(null);
                }
            }
        }

        // Dispatch current state to toolbar
        window.dispatchEvent(new CustomEvent('slide-updated', { detail: { slide, selectedLayerIndex, selectedOverlayIndex } }));
    }, [slide, selectedLayerIndex, selectedOverlayIndex]);

    useEffect(() => {
        if (selectedOverlayIndex) {
            window.dispatchEvent(
                new CustomEvent('overlay-selected', { detail: { layerIndex: selectedOverlayIndex.layerIndex, overlayIndex: selectedOverlayIndex.overlayIndex } })
            );
        } else {
            window.dispatchEvent(
                new CustomEvent('layer-selected', { detail: { layerIndex: selectedLayerIndex } })
            );
        }
    }, [selectedOverlayIndex, selectedLayerIndex]);

    useEffect(() => {
        const handleAddLayer = (event) => {
            const { layer } = event.detail || {};
            addLayer(layer);
        };

        const handleRemoveLayer = (event) => {
            const { layerIndex } = event.detail || {};
            removeLayer(typeof layerIndex === 'number' ? layerIndex : selectedLayerIndex);
        };

        const handleAddOverlay = (event) => {
            const { layerIndex } = event.detail || {};
            addOverlay(typeof layerIndex === 'number' ? layerIndex : selectedLayerIndex);
        };

        const handleRemoveOverlay = (event) => {
            const { layerIndex, overlayIndex } = event.detail || {};
            removeOverlay(
                typeof layerIndex === 'number' ? layerIndex : selectedLayerIndex,
                typeof overlayIndex === 'number' ? overlayIndex : (selectedOverlayIndex ? selectedOverlayIndex.overlayIndex : 0)
            );
        };

        const handleUpdateOverlay = (event) => {
            const { layerIndex, overlayIndex, updatedOverlay } = event.detail || {};
            if (updatedOverlay) {
                updateOverlay(
                    typeof layerIndex === 'number' ? layerIndex : selectedLayerIndex,
                    typeof overlayIndex === 'number' ? overlayIndex : (selectedOverlayIndex ? selectedOverlayIndex.overlayIndex : 0),
                    updatedOverlay
                );
            }
        };

        const handleUpdateLayer = (event) => {
            const { layerIndex, updatedLayer } = event.detail || {};
            if (updatedLayer) {
                setSlide(prevSlide => {
                    const updatedLayers = [...prevSlide.layers];
                    const idx = typeof layerIndex === 'number' ? layerIndex : selectedLayerIndex;
                    updatedLayers[idx] = { ...updatedLayers[idx], ...updatedLayer };
                    return { ...prevSlide, layers: updatedLayers };
                });
            }
        };

        const handleSelectLayer = (event) => {
            const index = parseInt(event.detail, 10);
            if (slide.layers[index]) {
                setLayerIndex(index);
                if (slide.layers[index].overlays && slide.layers[index].overlays.length > 0) {
                    setOverlayIndex({ layerIndex: index, overlayIndex: 0 });
                } else {
                    setOverlayIndex(null);
                }
            }
        };

        const handleSave = () => {
            window.dispatchEvent(new CustomEvent('save-slide', { detail: slide }));
        };

        const handleLoad = () => {
            window.dispatchEvent(new CustomEvent('load-slide', { detail: slide }));
        };

        window.addEventListener('add-layer', handleAddLayer);
        window.addEventListener('remove-layer', handleRemoveLayer);
        window.addEventListener('update-layer', handleUpdateLayer);
        window.addEventListener('select-layer', handleSelectLayer);
        window.addEventListener('add-overlay', handleAddOverlay);
        window.addEventListener('remove-overlay', handleRemoveOverlay);
        window.addEventListener('update-overlay', handleUpdateOverlay);
        window.addEventListener('request-save', handleSave);
        window.addEventListener('request-load', handleLoad);

        return () => {
            window.removeEventListener('add-layer', handleAddLayer);
            window.removeEventListener('remove-layer', handleRemoveLayer);
            window.removeEventListener('update-layer', handleUpdateLayer);
            window.removeEventListener('select-layer', handleSelectLayer);
            window.removeEventListener('add-overlay', handleAddOverlay);
            window.removeEventListener('remove-overlay', handleRemoveOverlay);
            window.removeEventListener('update-overlay', handleUpdateOverlay);
            window.removeEventListener('request-save', handleSave);
            window.removeEventListener('request-load', handleLoad);
        };
    }, [addLayer, removeLayer, addOverlay, removeOverlay, updateOverlay, slide, selectedLayerIndex, selectedOverlayIndex]);

    const mainLayer = {
        image: slide.image,
        level: 0
    };

    return (
        <div className={styles['slide-container']}>
            <Layer layer={mainLayer} />
            {slide.layers.map((layer, layerIndex) => (
                <Layer key={`layer_${layer.uid}`} layer={layer}>
                    {layer.overlays && layer.overlays.map((overlay, overlayIndex) => (
                        <Overlay
                            key={`overlay_${overlay.uid}`}
                            overlay={overlay}
                            editMode={true}
                            layerIsActive={selectedOverlayIndex?.layerIndex === layerIndex}
                            isActive={selectedOverlayIndex?.layerIndex === layerIndex && selectedOverlayIndex?.overlayIndex === overlayIndex}
                            onMouseDown={() => handleOverlaySelect(layerIndex, overlayIndex)}
                            onOverlayChange={(updatedOverlay) => updateOverlay(layerIndex, overlayIndex, updatedOverlay)}
                            onRemove={() => removeOverlay(layerIndex, overlayIndex)}
                        />
                    ))}
                </Layer>
            ))}
        </div>
    );
}