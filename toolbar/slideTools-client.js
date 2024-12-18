// slideTools-client.js
import { defineToolbarApp } from "astro/toolbar"

let currentSlide = {}
let currentLayer = 0
let currentOverlay = null

const toolbarWindow = document.createElement("astro-dev-toolbar-window")
const editorPanel = document.createElement("div")
const editorControls = document.createElement("div")
const layerSelect = document.createElement("select")

const styles = `
  .editor-panel { margin-bottom: 12px; }
  .editor-button:not(:last-child) { margin-right: 8px; }

  .editor-controls {
    display: flex;
    justify-content: space-between;
  }

  .input-wrap {
    display: flex;
    justify-content: space-between;
    margin-right: 12px;
    align-items: center;
  }

  .input-wrap label {
    line-height: 25px;
    display: inline-block;
    margin-right: 8px;
    min-width: 80px;
  }

  .editor-controls .left { display: flex; flex-direction: row; align-items: center; }
  .editor-controls .right { display: flex; flex-direction: row; align-items: center; }

  .layer-select {
    padding: 8px;
    font-size: 14px;
  }
`

const injectStyles = () => {
  const styleTag = document.createElement("style")
  styleTag.textContent = styles
  toolbarWindow.appendChild(styleTag)
}

const createButton = (text, className, eventName, payload) => {
  const Button = document.createElement("astro-dev-toolbar-button")
  Button.textContent = text
  Button.classList.add(className)
  Button.buttonStyle = "outline"
  Button.addEventListener("click", () => {
    window.dispatchEvent(new CustomEvent(eventName, { detail: payload || {} }))
  })
  return Button
}

const populateLayerSelect = () => {
  layerSelect.innerHTML = ""
  if (currentSlide.layers && currentSlide.layers.length > 0) {
    currentSlide.layers.forEach((layer, index) => {
      const option = document.createElement("option")
      option.value = index
      option.textContent = layer.id
      layerSelect.appendChild(option)
    })
  } else {
    const option = document.createElement("option")
    option.value = 0
    option.textContent = "Default"
    layerSelect.appendChild(option)
  }
  layerSelect.value = currentLayer
}

const createField = (text, ...elements) => {
  const wrapper = document.createElement("div")
  wrapper.classList.add("input-wrap")

  if (text) {
    const label = document.createElement("label")
    label.textContent = text
    wrapper.appendChild(label)
  }

  elements.forEach(e => wrapper.appendChild(e))
  return wrapper
}

function initControls(canvas) {
  editorPanel.classList.add("editor-panel")
  editorControls.classList.add("editor-controls")

  const editorControlsLeft = document.createElement("div")
  editorControlsLeft.classList.add("left")
  const editorControlsRight = document.createElement("div")
  editorControlsRight.classList.add("right")

  editorControls.appendChild(editorControlsLeft)
  editorControls.appendChild(editorControlsRight)

  toolbarWindow.appendChild(editorPanel)
  toolbarWindow.appendChild(editorControls)

  layerSelect.classList.add("layer-select")

  layerSelect.addEventListener("change", (e) => {
    currentLayer = parseInt(e.target.value, 10)
    window.dispatchEvent(new CustomEvent("select-layer", { detail: currentLayer }))
  })

  const addLayerButton = createButton("+", "editor-button", "add-layer")
  const removeLayerButton = createButton("-", "editor-button", "remove-layer", {
    layerIndex: currentLayer
  })
  const layerControls = createField("Layer", layerSelect, addLayerButton, removeLayerButton)

  const addOverlayButton = createButton("+", "editor-button", "add-overlay", {
    layerIndex: currentLayer
  })
  const removeOverlayButton = createButton("-", "editor-button", "remove-overlay", {
    layerIndex: currentLayer, overlayIndex: currentOverlay?.overlayIndex
  })
  const overlayControls = createField("Overlay", addOverlayButton, removeOverlayButton)

  const popupToggle = document.createElement("astro-dev-toolbar-toggle")
  const popupField = createField("Pop-up", popupToggle)

  const saveSlideButton = createButton("Save", "editor-button", "request-save")

  editorControlsLeft.appendChild(layerControls)
  editorControlsLeft.appendChild(overlayControls)
  editorControlsRight.appendChild(popupField)
  editorControlsRight.appendChild(saveSlideButton)

  canvas.appendChild(toolbarWindow)
}

// We will only rebuild the overlay form on overlay selection events, not on every slide update.
// This prevents losing focus as the user types.

let currentlyDisplayedOverlay = null // Track which overlay form we currently show

export default defineToolbarApp({
  init(canvas, app, server) {
    injectStyles()
    toolbarWindow.appendChild(editorPanel)

    app.onToggled(({ state }) => {
      window.dispatchEvent(new CustomEvent("edit-mode", { detail: state }))
    })

    window.addEventListener("slide-updated", (event) => {
      const { slide, selectedLayerIndex, selectedOverlayIndex } = event.detail
      currentSlide = slide
      currentLayer = selectedLayerIndex
      currentOverlay = selectedOverlayIndex || null

      populateLayerSelect()

      // On slide updates, we do NOT rebuild the overlay form if the same overlay is still selected.
      // This prevents losing focus during typing.
      // Only if overlay selection changes do we rebuild the form (handled in overlay-selected event).
    })

    window.addEventListener("layer-selected", (event) => {
      const { layerIndex } = event.detail
      currentLayer = layerIndex
      currentOverlay = null
      populateLayerSelect()
      editorPanel.innerHTML = ""
      currentlyDisplayedOverlay = null
    })

    window.addEventListener("overlay-selected", (event) => {
      const { layerIndex, overlayIndex } = event.detail
      currentLayer = layerIndex
      currentOverlay = { layerIndex, overlayIndex }
      populateLayerSelect()

      const layer = currentSlide.layers[layerIndex]
      const overlay = layer.overlays[overlayIndex]
      // Rebuild the overlay form since we changed overlay selection
      updateOverlayWindow(overlay, server)
      currentlyDisplayedOverlay = `${layerIndex}-${overlayIndex}`
    })

    window.addEventListener("load-slide", (event) => {
      currentSlide = event.detail
      populateLayerSelect()
      editorPanel.innerHTML = ""
      currentlyDisplayedOverlay = null
    })

    window.addEventListener("save-slide", (event) => {
      server.send("update-slide-data", event.detail)
    })

    initControls(canvas)

    window.dispatchEvent(new CustomEvent('request-load'))
  },
})

function updateOverlayWindow(overlay, server) {
  editorPanel.innerHTML = ""
  if (!overlay) return

  const form = document.createElement("form")
  form.style.display = "flex"
  form.style.flexDirection = "column"
  form.style.gap = "8px"

  const classField = createTextInputField("Class", overlay.class || "", (val) => {
    window.dispatchEvent(new CustomEvent("update-overlay", {
      detail: {
        layerIndex: currentOverlay.layerIndex,
        overlayIndex: currentOverlay.overlayIndex,
        updatedOverlay: { class: val }
      }
    }))
  })

  const targetField = createTextInputField("Target", overlay.target || "", (val) => {
    window.dispatchEvent(new CustomEvent("update-overlay", {
      detail: {
        layerIndex: currentOverlay.layerIndex,
        overlayIndex: currentOverlay.overlayIndex,
        updatedOverlay: { target: val }
      }
    }))
  })

  form.appendChild(classField)
  form.appendChild(targetField)

  editorPanel.appendChild(form)
}

function createTextInputField(labelText, initialValue, onInputChange) {
  const wrapper = document.createElement("div")
  wrapper.classList.add("input-wrap")

  const label = document.createElement("label")
  label.textContent = labelText

  const input = document.createElement("input")
  input.type = "text"
  input.value = initialValue
  input.style.padding = "8px"
  input.style.fontSize = "14px"
  
  // Updating on input ensures immediate dispatch. Since we do not re-render the form on slide-updated,
  // focus remains intact.
  input.addEventListener("input", (e) => onInputChange(e.target.value))

  wrapper.appendChild(label)
  wrapper.appendChild(input)
  return wrapper
}