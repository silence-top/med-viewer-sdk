import { svgPathProperties } from 'svg-path-properties'
import { t } from '../i18n/i18n'

/**
 * 自动换算单位并格式化显示
 * 输入值单位为 μm，根据量级自动升降单位
 * @param value - μm 值
 * @param unitSuffix - 基础单位后缀（如 'm'、'm²'）
 */
function getWithUnit(value: number, unitSuffix: string): string {
  const isArea = unitSuffix.includes('²')
  const baseSuffix = unitSuffix.replace('²', '')

  if (isArea) {
    // 面积单位：μm² → mm² → m²
    if (value >= 1e12) {
      return (value / 1e12).toFixed(2) + ' ' + baseSuffix + '²'
    }
    if (value >= 1e6) {
      return (value / 1e6).toFixed(2) + ' m' + baseSuffix + '²'
    }
    return value.toFixed(2) + ' μ' + baseSuffix + '²'
  } else {
    // 长度单位：μm → mm → m
    if (value >= 1e6) {
      return (value / 1e6).toFixed(2) + ' ' + baseSuffix
    }
    if (value >= 1e3) {
      return (value / 1e3).toFixed(2) + ' m' + baseSuffix
    }
    return value.toFixed(2) + ' μ' + baseSuffix
  }
}

/**
 * 将像素值换算为微米（μm）
 */
function pixelsToMicrons(value: number, pixelsPerMeter: number): number {
  return (value / pixelsPerMeter) * 1_000_000
}

/**
 * 鞋带公式计算多边形面积（像素²）
 */
function computePolygonArea(pts: Array<[number, number]>): number {
  let sum = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[i + 1]
    sum += x1 * y2 - x2 * y1
  }
  return Math.abs(sum / 2)
}

/**
 * 标注图形测量标签格式化器
 * @param pixelsPerMeter - 每米像素数，用于换算物理尺寸
 * @param showMeasure - 是否显示测量信息
 */
export const ShapeLabelsFormatter =
  (pixelsPerMeter: number, showMeasure: boolean) =>
  (annotation: any): { element: SVGForeignObjectElement } => {
    const bodies: any[] = Array.isArray(annotation.body)
      ? annotation.body
      : [annotation.body]

    let toolName: string | null = annotation.target.renderedVia?.name ?? null
    if (!showMeasure) toolName = null

    const foreignObject = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'foreignObject'
    ) as SVGForeignObjectElement
    foreignObject.setAttribute('width', '1px')
    foreignObject.setAttribute('height', '1px')

    const firstTag = bodies.find((b) => b?.purpose === 'commenting')

    const wrapLabel = (rows: string[], remark?: string) => {
      const remarkRow = remark
        ? `<p>${t('annotation.remark')}:&nbsp;&nbsp;${remark}</p>`
        : ''
      return `<div xmlns="http://www.w3.org/1999/xhtml" class="a9s-shape-label-wrapper">
  <div class="a9s-shape-label">
    ${rows.map((r) => `<p>${r}</p>`).join('')}
    ${remarkRow}
  </div>
</div>`
    }

    switch (toolName) {
      case 'line': {
        const div = document.createElement('div')
        div.innerHTML = annotation.target.selector.value
        const el = div.getElementsByTagName('line')[0]
        const x1 = pixelsToMicrons(Number(el.getAttribute('x1')), pixelsPerMeter)
        const y1 = pixelsToMicrons(Number(el.getAttribute('y1')), pixelsPerMeter)
        const x2 = pixelsToMicrons(Number(el.getAttribute('x2')), pixelsPerMeter)
        const y2 = pixelsToMicrons(Number(el.getAttribute('y2')), pixelsPerMeter)
        const len = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
        foreignObject.innerHTML = wrapLabel(
          [`${t('annotation.length')}:&nbsp;&nbsp;${getWithUnit(len, 'm')}`],
          firstTag?.value
        )
        break
      }

      case 'rect': {
        const str = annotation.target.selector.value.replace(/xywh=pixel:/g, '')
        const parts = str.split(',')
        const rw = pixelsToMicrons(Number(parts[2]), pixelsPerMeter)
        const rh = pixelsToMicrons(Number(parts[3]), pixelsPerMeter)
        const rp = 2 * (rw + rh)
        const ra = rw * rh
        foreignObject.innerHTML = wrapLabel(
          [
            `${t('annotation.width')}:&nbsp;&nbsp;${getWithUnit(rw, 'm')}`,
            `${t('annotation.height')}:&nbsp;&nbsp;${getWithUnit(rh, 'm')}`,
            `${t('annotation.perimeter')}:&nbsp;&nbsp;${getWithUnit(rp, 'm')}`,
            `${t('annotation.area')}:&nbsp;&nbsp;${getWithUnit(ra, 'm²')}`
          ],
          firstTag?.value
        )
        break
      }

      case 'circle': {
        const div = document.createElement('div')
        div.innerHTML = annotation.target.selector.value
        const el = div.getElementsByTagName('circle')[0]
        const r = pixelsToMicrons(Number(el.getAttribute('r')), pixelsPerMeter)
        const circum = 2 * Math.PI * r
        const area = Math.PI * r * r
        foreignObject.innerHTML = wrapLabel(
          [
            `${t('annotation.radius')}:&nbsp;&nbsp;${getWithUnit(r, 'm')}`,
            `${t('annotation.perimeter')}:&nbsp;&nbsp;${getWithUnit(circum, 'm')}`,
            `${t('annotation.area')}:&nbsp;&nbsp;${getWithUnit(area, 'm²')}`
          ],
          firstTag?.value
        )
        break
      }

      case 'ellipse': {
        const div = document.createElement('div')
        div.innerHTML = annotation.target.selector.value
        const el = div.getElementsByTagName('ellipse')[0]
        const rx = pixelsToMicrons(Number(el.getAttribute('rx')), pixelsPerMeter)
        const ry = pixelsToMicrons(Number(el.getAttribute('ry')), pixelsPerMeter)
        const majorAxis = Math.max(rx, ry)
        const minorAxis = Math.min(rx, ry)
        const perim = Math.PI * (3 * (rx + ry) - Math.sqrt((3 * rx + ry) * (rx + 3 * ry)))
        const area = Math.PI * rx * ry
        foreignObject.innerHTML = wrapLabel(
          [
            `${t('annotation.majorAxis')}:&nbsp;&nbsp;${getWithUnit(majorAxis, 'm')}`,
            `${t('annotation.minorAxis')}:&nbsp;&nbsp;${getWithUnit(minorAxis, 'm')}`,
            `${t('annotation.perimeter')}:&nbsp;&nbsp;${getWithUnit(perim, 'm')}`,
            `${t('annotation.area')}:&nbsp;&nbsp;${getWithUnit(area, 'm²')}`
          ],
          firstTag?.value
        )
        break
      }

      case 'polygon': {
        const div = document.createElement('div')
        div.innerHTML = annotation.target.selector.value
        const el = div.getElementsByTagName('polygon')[0]
        const pts = (el.getAttribute('points') ?? '')
          .trim()
          .split(/\s+/)
          .map((p) => {
            const [x, y] = p.split(',').map(parseFloat)
            return [
              pixelsToMicrons(x, pixelsPerMeter),
              pixelsToMicrons(y, pixelsPerMeter)
            ] as [number, number]
          })

        let polyPerim = 0
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i]
          const [bx, by] = pts[(i + 1) % pts.length]
          polyPerim += Math.sqrt(Math.pow(bx - ax, 2) + Math.pow(by - ay, 2))
        }
        const polyArea = computePolygonArea(pts)
        foreignObject.innerHTML = wrapLabel(
          [
            `${t('annotation.perimeter')}:&nbsp;&nbsp;${getWithUnit(polyPerim, 'm')}`,
            `${t('annotation.area')}:&nbsp;&nbsp;${getWithUnit(polyArea, 'm²')}`
          ],
          firstTag?.value
        )
        break
      }

      case 'freehand': {
        const div = document.createElement('div')
        div.innerHTML = annotation.target.selector.value
        const el = div.getElementsByTagName('path')[0]
        const d = el.getAttribute('d') ?? ''
        const props = new svgPathProperties(d)
        const pixelPerim = props.getTotalLength()

        const steps = 300
        const fhPts: Array<[number, number]> = []
        for (let i = 0; i <= steps; i++) {
          const pos = props.getPointAtLength((i / steps) * pixelPerim)
          fhPts.push([pos.x, pos.y])
        }

        const areaPixel = computePolygonArea(fhPts)
        const realPerim = pixelsToMicrons(pixelPerim, pixelsPerMeter)
        const pixelToMicro = pixelsToMicrons(1, pixelsPerMeter)
        const realArea = areaPixel * pixelToMicro * pixelToMicro

        foreignObject.innerHTML = wrapLabel(
          [
            `${t('annotation.length')}:&nbsp;&nbsp;${getWithUnit(realPerim, 'm')}`,
            `${t('annotation.area')}:&nbsp;&nbsp;${getWithUnit(realArea, 'm²')}`
          ],
          firstTag?.value
        )
        break
      }

      default:
        if (firstTag) {
          foreignObject.innerHTML = wrapLabel(
            [],
            firstTag.value
          )
        }
    }

    return { element: foreignObject }
  }

export function injectShapeLabelStyles(): void {
  const styleId = 'med-anno-default-shapeLabelsFormatter-overrides'
  if (document.getElementById(styleId)) return
  const style = document.createElement('style')
  style.id = styleId
  style.innerHTML = `
.a9s-annotationlayer .a9s-formatter-el,
.a9s-annotationlayer .a9s-formatter-el foreignObject {
  overflow: visible;
  pointer-events: none;
}
.a9s-annotationlayer .a9s-formatter-el foreignObject .a9s-shape-label-wrapper {
  position: relative;
  transform: translateY(-100%);
  padding-bottom: 4px;
}
.a9s-annotationlayer .a9s-formatter-el foreignObject .a9s-shape-label-wrapper .a9s-shape-label {
  display: inline-block;
  max-width: 24vw !important;
  color: #000;
  word-wrap: break-word;
  word-break: keep-all;
  padding: 3px 5px;
  margin-bottom: 2px;
  background-color: rgba(255, 255, 255, 0.85);
  border-radius: 3px;
  font-size: 14px;
}
.a9s-annotationlayer .a9s-formatter-el foreignObject .a9s-shape-label-wrapper .a9s-shape-label p {
  margin: 5px !important;
}
  `
  document.head.appendChild(style)
}
