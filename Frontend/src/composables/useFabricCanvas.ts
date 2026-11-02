import { ref, shallowRef } from 'vue';
import * as fabric from 'fabric';

/** AnnotationData captures the JSON state of all drawn objects for persistence */
export interface AnnotationData {
  objects: fabric.FabricObject[];
  canvasWidth: number;
  canvasHeight: number;
  imageScale: number;
  imageLeft: number;
  imageTop: number;
}

/** Result emitted on save */
export interface AnnotatorSaveResult {
  /** The original image as-is (no annotations) */
  originalBlob: Blob;
  /** The annotated (and optionally cropped/rotated) image */
  editedBlob: Blob;
  /** Serialized annotation data for future re-editing */
  annotationData: AnnotationData;
}

export type DrawMode = 'freehand' | 'circle' | 'arrow' | 'cross' | 'rectangle' | 'select';

export function useFabricCanvas() {
  const canvas = shallowRef<fabric.Canvas | null>(null);
  const currentMode = ref<DrawMode>('freehand');
  const rotationAngle = ref(0);

  // Keep reference to the background image for original export
  let backgroundImage: fabric.FabricImage | null = null;
  let originalImageUrl = '';

  // ── Zoom / Pan state ──────────────────────────────────────────
  let lastPinchDist = 0;
  let isPanning = false;
  let lastPanX = 0;
  let lastPanY = 0;

  // ── Cropping state ────────────────────────────────────────────
  const isCropping = ref(false);
  let cropRect: fabric.Rect | null = null;

  const initCanvas = async (canvasElement: HTMLCanvasElement, imageUrl: string) => {
    originalImageUrl = imageUrl;

    const fabCanvas = new fabric.Canvas(canvasElement, {
      isDrawingMode: true,
      width: window.innerWidth,
      height: window.innerHeight - 120, // Space for toolbar
      selection: false,
    });

    const brush = new fabric.PencilBrush(fabCanvas);
    brush.color = 'red';
    brush.width = 4;
    fabCanvas.freeDrawingBrush = brush;

    canvas.value = fabCanvas;

    try {
      const img = await fabric.FabricImage.fromURL(imageUrl, { crossOrigin: 'anonymous' });
      const scale = Math.min(
        fabCanvas.width / img.width,
        fabCanvas.height / img.height,
      );

      img.scale(scale);
      img.set({
        left: (fabCanvas.width - img.width * scale) / 2,
        top: (fabCanvas.height - img.height * scale) / 2,
        originX: 'left',
        originY: 'top',
      });

      backgroundImage = img;
      fabCanvas.backgroundImage = img;
      fabCanvas.renderAll();
    } catch (error) {
      console.error('Error loading background image', error);
    }

    // ── Touch gestures: pinch-to-zoom & two-finger pan ────────
    setupTouchGestures(fabCanvas);

    // ── Double-tap to zoom ────────────────────────────────────
    setupDoubleTap(fabCanvas);
  };

  // ── Touch gesture handlers ──────────────────────────────────
  const setupTouchGestures = (fabCanvas: fabric.Canvas) => {
    const upperCanvas = fabCanvas.upperCanvasEl;

    upperCanvas.addEventListener('touchstart', (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        fabCanvas.isDrawingMode = false;
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        isPanning = true;
        lastPanX = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
        lastPanY = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2;
      }
    }, { passive: false });

    upperCanvas.addEventListener('touchmove', (e: TouchEvent) => {
      if (e.touches.length === 2 && isPanning) {
        e.preventDefault();
        const dx = e.touches[0]!.clientX - e.touches[1]!.clientX;
        const dy = e.touches[0]!.clientY - e.touches[1]!.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Pinch zoom
        if (lastPinchDist > 0) {
          const zoomFactor = dist / lastPinchDist;
          const midX = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
          const midY = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2;

          const rect = upperCanvas.getBoundingClientRect();
          const point = new fabric.Point(midX - rect.left, midY - rect.top);

          let newZoom = fabCanvas.getZoom() * zoomFactor;
          newZoom = Math.max(0.5, Math.min(newZoom, 5));
          fabCanvas.zoomToPoint(point, newZoom);
        }
        lastPinchDist = dist;

        // Pan
        const currentPanX = (e.touches[0]!.clientX + e.touches[1]!.clientX) / 2;
        const currentPanY = (e.touches[0]!.clientY + e.touches[1]!.clientY) / 2;
        const vpt = fabCanvas.viewportTransform;
        if (vpt) {
          vpt[4] += currentPanX - lastPanX;
          vpt[5] += currentPanY - lastPanY;
          fabCanvas.setViewportTransform(vpt);
        }
        lastPanX = currentPanX;
        lastPanY = currentPanY;
      }
    }, { passive: false });

    upperCanvas.addEventListener('touchend', (e: TouchEvent) => {
      if (e.touches.length < 2) {
        isPanning = false;
        lastPinchDist = 0;
        if (currentMode.value === 'freehand') {
          fabCanvas.isDrawingMode = true;
        }
      }
    });

    // Mouse wheel zoom (desktop)
    fabCanvas.on('mouse:wheel', (opt) => {
      const delta = opt.e.deltaY;
      let zoom = fabCanvas.getZoom();
      zoom *= 0.999 ** delta;
      zoom = Math.max(0.5, Math.min(zoom, 5));
      fabCanvas.zoomToPoint(
        new fabric.Point(opt.e.offsetX, opt.e.offsetY),
        zoom,
      );
      opt.e.preventDefault();
      opt.e.stopPropagation();
    });
  };

  // ── Double-tap to zoom ──────────────────────────────────────
  const setupDoubleTap = (fabCanvas: fabric.Canvas) => {
    let lastTap = 0;
    const upperCanvas = fabCanvas.upperCanvasEl;

    upperCanvas.addEventListener('touchend', (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTap < 300 && e.changedTouches.length === 1) {
        e.preventDefault();
        const touch = e.changedTouches[0]!;
        const rect = upperCanvas.getBoundingClientRect();
        const point = new fabric.Point(touch.clientX - rect.left, touch.clientY - rect.top);
        const currentZoom = fabCanvas.getZoom();

        if (currentZoom > 1.1) {
          // Reset zoom
          fabCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        } else {
          // Zoom in 2x
          fabCanvas.zoomToPoint(point, 2);
        }
      }
      lastTap = now;
    });
  };

  // ── Reset zoom ──────────────────────────────────────────────
  const resetZoom = () => {
    if (!canvas.value) return;
    canvas.value.setViewportTransform([1, 0, 0, 1, 0, 0]);
  };

  // ── Draw mode switcher ──────────────────────────────────────
  const setDrawMode = (mode: DrawMode) => {
    if (!canvas.value) return;
    currentMode.value = mode;
    canvas.value.isDrawingMode = mode === 'freehand';

    // Cancel crop if switching away
    if (mode !== 'select' && isCropping.value) {
      cancelCrop();
    }

    if (mode === 'select') {
      canvas.value.selection = true;
      canvas.value.forEachObject((obj) => {
        if (obj === cropRect) return;
        obj.selectable = true;
        obj.evented = true;
      });
    } else {
      canvas.value.selection = false;
      canvas.value.forEachObject((obj) => {
        obj.selectable = false;
        obj.evented = false;
      });
    }
  };

  // ── Add Circle ──────────────────────────────────────────────
  const addCircle = () => {
    if (!canvas.value) return;
    const circle = new fabric.Circle({
      radius: 50,
      fill: 'transparent',
      stroke: 'red',
      strokeWidth: 4,
      left: canvas.value.width / 2 - 50,
      top: canvas.value.height / 2 - 50,
    });
    canvas.value.add(circle);
    canvas.value.setActiveObject(circle);
    setDrawMode('select');
  };

  // ── Add Arrow ───────────────────────────────────────────────
  const addArrow = () => {
    if (!canvas.value) return;
    const line = new fabric.Line([0, 0, 100, 100], {
      stroke: 'red',
      strokeWidth: 4,
    });

    const triangle = new fabric.Triangle({
      width: 20,
      height: 20,
      fill: 'red',
      left: 100,
      top: 100,
      angle: 45,
      originX: 'center',
      originY: 'center',
    });

    const group = new fabric.Group([line, triangle], {
      left: canvas.value.width / 2 - 50,
      top: canvas.value.height / 2 - 50,
    });

    canvas.value.add(group);
    canvas.value.setActiveObject(group);
    setDrawMode('select');
  };

  // ── Add Cross (X) ──────────────────────────────────────────
  const addCross = () => {
    if (!canvas.value) return;
    const size = 60;
    const strokeWidth = 5;

    const line1 = new fabric.Line([0, 0, size, size], {
      stroke: 'red',
      strokeWidth,
      strokeLineCap: 'round',
    });

    const line2 = new fabric.Line([size, 0, 0, size], {
      stroke: 'red',
      strokeWidth,
      strokeLineCap: 'round',
    });

    const group = new fabric.Group([line1, line2], {
      left: canvas.value.width / 2 - size / 2,
      top: canvas.value.height / 2 - size / 2,
    });

    canvas.value.add(group);
    canvas.value.setActiveObject(group);
    setDrawMode('select');
  };

  // ── Add Rectangle ──────────────────────────────────────────
  const addRectangle = () => {
    if (!canvas.value) return;
    const rect = new fabric.Rect({
      width: 120,
      height: 80,
      fill: 'transparent',
      stroke: 'red',
      strokeWidth: 4,
      left: canvas.value.width / 2 - 60,
      top: canvas.value.height / 2 - 40,
    });
    canvas.value.add(rect);
    canvas.value.setActiveObject(rect);
    setDrawMode('select');
  };

  // ── Rotate image ────────────────────────────────────────────
  const rotateImage = (degrees: number) => {
    if (!canvas.value || !backgroundImage) return;
    rotationAngle.value = (rotationAngle.value + degrees) % 360;

    const bg = backgroundImage;
    bg.set({ angle: rotationAngle.value });

    // Recalculate position after rotation
    const fabCanvas = canvas.value;
    const boundingRect = bg.getBoundingRect();
    const scale = Math.min(
      fabCanvas.width / boundingRect.width,
      fabCanvas.height / boundingRect.height,
    );

    // ตั้งจุดหมุนที่กลางรูป
    bg.set({
      originX: 'center',
      originY: 'center',
      left: fabCanvas.width / 2,
      top: fabCanvas.height / 2,
      scaleX: bg.scaleX * scale,
      scaleY: bg.scaleY * scale,
    });

    fabCanvas.renderAll();
  };

  // ── Helper: get the visible image bounds on canvas ─────────
  const getImageBounds = (): { left: number; top: number; width: number; height: number } | null => {
    if (!backgroundImage) return null;
    const bg = backgroundImage;
    const imgLeft = bg.left ?? 0;
    const imgTop = bg.top ?? 0;
    const imgWidth = bg.width * (bg.scaleX ?? 1);
    const imgHeight = bg.height * (bg.scaleY ?? 1);

    // Handle center origin if rotated
    let actualLeft = imgLeft;
    let actualTop = imgTop;
    if (bg.originX === 'center') actualLeft = imgLeft - imgWidth / 2;
    if (bg.originY === 'center') actualTop = imgTop - imgHeight / 2;

    return { left: actualLeft, top: actualTop, width: imgWidth, height: imgHeight };
  };

  // ── Crop mode ───────────────────────────────────────────────
  const startCrop = () => {
    if (!canvas.value) return;
    isCropping.value = true;

    // Remove existing crop rect if present
    if (cropRect) {
      canvas.value.remove(cropRect);
    }

    // Position crop rect centered on the actual image, with 10% inset
    const imgBounds = getImageBounds();
    const fabCanvas = canvas.value;
    let cropLeft: number, cropTop: number, cropW: number, cropH: number;

    if (imgBounds) {
      const inset = 0.1; // 10% padding inside the image
      cropLeft = imgBounds.left + imgBounds.width * inset;
      cropTop = imgBounds.top + imgBounds.height * inset;
      cropW = imgBounds.width * (1 - inset * 2);
      cropH = imgBounds.height * (1 - inset * 2);
    } else {
      // Fallback: center of canvas
      const margin = 40;
      cropLeft = margin;
      cropTop = margin;
      cropW = fabCanvas.width - margin * 2;
      cropH = fabCanvas.height - margin * 2;
    }

    cropRect = new fabric.Rect({
      left: cropLeft,
      top: cropTop,
      width: cropW,
      height: cropH,
      fill: 'rgba(0,0,0,0)',
      stroke: '#ffffff',
      strokeWidth: 2,
      strokeDashArray: [8, 4],
      cornerColor: '#ffffff',
      cornerStrokeColor: '#333333',
      cornerSize: 14,
      transparentCorners: false,
      hasRotatingPoint: false,
      lockRotation: true,
    });

    canvas.value.add(cropRect);
    canvas.value.setActiveObject(cropRect);
    setDrawMode('select');
  };

  const applyCrop = async (): Promise<boolean> => {
    if (!canvas.value || !cropRect || !backgroundImage) return false;

    const fabCanvas = canvas.value;

    // 1. Reset viewport so all coordinate calculations are in canvas space
    fabCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
    fabCanvas.renderAll();

    // 2. Use getBoundingRect to get absolute pixel coordinates of the crop rect
    //    This correctly accounts for any object scaling/moving the user did
    const bound = cropRect.getBoundingRect();
    const cropLeft = bound.left;
    const cropTop = bound.top;
    const cropWidth = bound.width;
    const cropHeight = bound.height;

    // 3. Remove crop rect before export so it doesn't appear in the image
    fabCanvas.remove(cropRect);
    cropRect = null;
    isCropping.value = false;
    fabCanvas.renderAll();

    // 4. Clamp crop area to canvas bounds to avoid blank areas
    const clampedLeft = Math.max(0, cropLeft);
    const clampedTop = Math.max(0, cropTop);
    const clampedWidth = Math.min(cropWidth, fabCanvas.width - clampedLeft);
    const clampedHeight = Math.min(cropHeight, fabCanvas.height - clampedTop);

    if (clampedWidth <= 0 || clampedHeight <= 0) return false;

    // 5. Export only the crop area
    const croppedDataUrl = fabCanvas.toDataURL({
      format: 'jpeg',
      quality: 0.9,
      multiplier: 1,
      left: clampedLeft,
      top: clampedTop,
      width: clampedWidth,
      height: clampedHeight,
    });

    // 6. Clear canvas and set cropped image as new background
    fabCanvas.clear();

    try {
      const newImg = await fabric.FabricImage.fromURL(croppedDataUrl, { crossOrigin: 'anonymous' });
      const scale = Math.min(
        fabCanvas.width / newImg.width,
        fabCanvas.height / newImg.height,
      );
      newImg.scale(scale);
      newImg.set({
        left: (fabCanvas.width - newImg.width * scale) / 2,
        top: (fabCanvas.height - newImg.height * scale) / 2,
        originX: 'left',
        originY: 'top',
      });
      backgroundImage = newImg;
      fabCanvas.backgroundImage = newImg;
      fabCanvas.renderAll();
      return true;
    } catch (error) {
      console.error('Failed to apply crop', error);
      return false;
    }
  };

  const cancelCrop = () => {
    if (!canvas.value || !cropRect) return;
    canvas.value.remove(cropRect);
    cropRect = null;
    isCropping.value = false;
  };

  // ── Undo ────────────────────────────────────────────────────
  const undo = () => {
    if (!canvas.value) return;
    const objects = canvas.value.getObjects();
    if (objects.length > 0) {
      canvas.value.remove(objects[objects.length - 1]!);
    }
  };

  // ── Delete selected ─────────────────────────────────────────
  const deleteSelected = () => {
    if (!canvas.value) return;
    const activeObj = canvas.value.getActiveObject();
    if (activeObj && activeObj !== cropRect) {
      canvas.value.remove(activeObj);
      canvas.value.discardActiveObject();
    }
  };

  // ── Export original (no annotations) ────────────────────────
  const exportOriginalAsBlob = async (): Promise<Blob | null> => {
    if (!originalImageUrl) return null;
    try {
      const response = await fetch(originalImageUrl);
      return await response.blob();
    } catch {
      return null;
    }
  };

  // ── Export annotated canvas (image region only, no black borders) ──
  const exportAsBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!canvas.value) return resolve(null);

      // Reset zoom so export is full view
      const fabCanvas = canvas.value;
      const currentVpt = [...fabCanvas.viewportTransform] as [number, number, number, number, number, number];
      fabCanvas.setViewportTransform([1, 0, 0, 1, 0, 0]);

      // Determine the image region to export (only the image area, not the full canvas)
      const imgBounds = getImageBounds();

      let dataUrl: string;
      try {
        if (imgBounds) {
          // Export only the image region → eliminates black borders
          dataUrl = fabCanvas.toDataURL({
            format: 'jpeg',
            quality: 0.8,
            multiplier: 1,
            left: imgBounds.left,
            top: imgBounds.top,
            width: imgBounds.width,
            height: imgBounds.height,
          });
        } else {
          // Fallback: export entire canvas
          dataUrl = fabCanvas.toDataURL({
            format: 'jpeg',
            quality: 0.8,
            multiplier: 1,
          });
        }
      } catch (error) {
        console.error('Failed to export canvas (tainted?)', error);
        fabCanvas.setViewportTransform(currentVpt);
        resolve(null);
        return;
      }

      fabCanvas.setViewportTransform(currentVpt);

      fetch(dataUrl)
        .then((res) => res.blob())
        .then((blob) => resolve(blob))
        .catch(() => resolve(null));
    });
  };

  // ── Export annotation data ──────────────────────────────────
  const exportAnnotationData = (): AnnotationData | null => {
    if (!canvas.value || !backgroundImage) return null;
    return {
      objects: canvas.value.getObjects(),
      canvasWidth: canvas.value.width,
      canvasHeight: canvas.value.height,
      imageScale: backgroundImage.scaleX,
      imageLeft: backgroundImage.left ?? 0,
      imageTop: backgroundImage.top ?? 0,
    };
  };

  // ── Full save (original + edited + annotation data) ─────────
  const exportSaveResult = async (): Promise<AnnotatorSaveResult | null> => {
    const [originalBlob, editedBlob] = await Promise.all([
      exportOriginalAsBlob(),
      exportAsBlob(),
    ]);
    const annotationData = exportAnnotationData();

    if (!originalBlob || !editedBlob || !annotationData) return null;

    return {
      originalBlob,
      editedBlob,
      annotationData,
    };
  };

  // ── Destroy ─────────────────────────────────────────────────
  const destroyCanvas = async () => {
    if (canvas.value) {
      await canvas.value.dispose();
      canvas.value = null;
    }
    backgroundImage = null;
    originalImageUrl = '';
    rotationAngle.value = 0;
    isCropping.value = false;
    cropRect = null;
    lastPinchDist = 0;
    isPanning = false;
  };

  return {
    canvas,
    currentMode,
    rotationAngle,
    isCropping,
    initCanvas,
    setDrawMode,
    addCircle,
    addArrow,
    addCross,
    addRectangle,
    rotateImage,
    startCrop,
    applyCrop,
    cancelCrop,
    resetZoom,
    undo,
    deleteSelected,
    exportAsBlob,
    exportOriginalAsBlob,
    exportAnnotationData,
    exportSaveResult,
    destroyCanvas,
  };
}
