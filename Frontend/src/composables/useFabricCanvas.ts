import { ref, shallowRef } from 'vue';
import * as fabric from 'fabric';

export function useFabricCanvas() {
  const canvas = shallowRef<fabric.Canvas | null>(null);
  const currentMode = ref<'freehand' | 'circle' | 'arrow' | 'select'>('freehand');

  const initCanvas = async (canvasElement: HTMLCanvasElement, imageUrl: string) => {
    const fabCanvas = new fabric.Canvas(canvasElement, {
      isDrawingMode: true,
      width: window.innerWidth,
      height: window.innerHeight - 120 // Space for toolbar
    });

    const brush = new fabric.PencilBrush(fabCanvas);
    brush.color = 'red';
    brush.width = 4;
    fabCanvas.freeDrawingBrush = brush;

    canvas.value = fabCanvas;

    try {
      const img = await fabric.FabricImage.fromURL(imageUrl);
      
      // Center and scale image
      const scale = Math.min(
        fabCanvas.width / img.width,
        fabCanvas.height / img.height
      );
      
      img.scale(scale);
      
      // Center the image
      img.set({
        left: (fabCanvas.width - img.width * scale) / 2,
        top: (fabCanvas.height - img.height * scale) / 2,
        originX: 'left',
        originY: 'top'
      });
      
      fabCanvas.backgroundImage = img;
      fabCanvas.renderAll();
    } catch (error) {
      console.error('Error loading background image', error);
    }
  };

  const setDrawMode = (mode: 'freehand' | 'circle' | 'arrow' | 'select') => {
    if (!canvas.value) return;
    currentMode.value = mode;
    canvas.value.isDrawingMode = mode === 'freehand';
    
    if (mode === 'select') {
      canvas.value.selection = true;
      canvas.value.forEachObject((obj) => {
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

  const addArrow = () => {
    if (!canvas.value) return;
    // Simple arrow representation
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

  const undo = () => {
    if (!canvas.value) return;
    const objects = canvas.value.getObjects();
    if (objects.length > 0) {
      canvas.value.remove(objects[objects.length - 1]!);
    }
  };

  const exportAsBlob = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      if (!canvas.value) return resolve(null);
      
      const dataUrl = canvas.value.toDataURL({
        format: 'jpeg',
        quality: 0.8,
        multiplier: 1
      });
      
      fetch(dataUrl)
        .then(res => res.blob())
        .then(blob => resolve(blob))
        .catch(() => resolve(null));
    });
  };
  
  const destroyCanvas = async () => {
    if (canvas.value) {
      await canvas.value.dispose();
      canvas.value = null;
    }
  };

  return {
    canvas,
    currentMode,
    initCanvas,
    setDrawMode,
    addCircle,
    addArrow,
    undo,
    exportAsBlob,
    destroyCanvas
  };
}
