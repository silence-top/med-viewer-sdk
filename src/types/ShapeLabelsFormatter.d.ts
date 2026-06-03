declare module "@/plugins/ShapeLabelsFormatter" {
  /** * 对应源码: const ShapeLabelsFormatter = (pixelsPerMeter, ShowMeasure) => (annotation) => { ... }
   */
  const ShapeLabelsFormatter: (
    pixelsPerMeter: number, 
    showMeasure: boolean
  ) => (annotation: any) => {
    element: SVGForeignObjectElement;
  };

  export { ShapeLabelsFormatter, injectShapeLabelStyles };
}