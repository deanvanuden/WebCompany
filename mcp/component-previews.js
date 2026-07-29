const line = (x1, y1, x2, y2, className = "pv-line") =>
  `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${className}" />`;

const rect = (
  x,
  y,
  width,
  height,
  className = "pv-surface",
  radius = 3,
) =>
  `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" class="${className}" />`;

const circle = (cx, cy, radius, className = "pv-accent") =>
  `<circle cx="${cx}" cy="${cy}" r="${radius}" class="${className}" />`;

const path = (definition, className = "pv-line") =>
  `<path d="${definition}" class="${className}" />`;

const label = (x, y, value, className = "pv-type") =>
  `<text x="${x}" y="${y}" class="${className}">${value}</text>`;

function dotField({
  columns = 12,
  rows = 6,
  startX = 28,
  startY = 30,
  gapX = 24,
  gapY = 24,
  radius = 2,
  className = "pv-muted-fill",
  bend = 0,
} = {}) {
  const dots = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const distance = Math.abs(column - (columns - 1) / 2);
      const influence = Math.max(0, 1 - distance / (columns / 2));
      const offset = bend * influence * Math.sin((row / Math.max(1, rows - 1)) * Math.PI);
      dots.push(
        circle(
          startX + column * gapX + offset,
          startY + row * gapY,
          radius + influence * (bend ? 0.7 : 0),
          column === Math.floor(columns * 0.68) && row === Math.floor(rows / 2)
            ? "pv-accent"
            : className,
        ),
      );
    }
  }
  return dots.join("");
}

function barChart(values, { x = 40, y = 145, width = 22, gap = 13 } = {}) {
  return values
    .map((value, index) =>
      rect(
        x + index * (width + gap),
        y - value,
        width,
        value,
        index === values.length - 2 ? "pv-accent" : "pv-muted-fill",
        2,
      ),
    )
    .join("");
}

function imageFrame(x, y, width, height, className = "pv-surface") {
  return `
    ${rect(x, y, width, height, className, 4)}
    ${circle(x + width * 0.72, y + height * 0.27, 7, "pv-accent")}
    ${path(
      `M${x + 12} ${y + height - 12} L${x + width * 0.38} ${y + height * 0.48} L${x + width * 0.58} ${y + height * 0.7} L${x + width - 10} ${y + height * 0.36}`,
      "pv-muted-line",
    )}
  `;
}

const previewRenderers = {
  "aurora-ribbon-field": () => `
    ${path("M-20 130 C50 40 112 178 184 84 C232 20 286 40 350 4", "pv-wide-accent")}
    ${path("M-10 160 C54 90 116 202 194 110 C254 38 298 82 346 42", "pv-wide-accent-2")}
    ${path("M0 102 C80 18 126 140 205 54 C250 8 292 22 330 8", "pv-muted-line")}
  `,
  "reactive-dot-lattice": () => `
    ${dotField({ columns: 13, rows: 7, startX: 18, startY: 20, gapX: 24, gapY: 23, bend: 17 })}
    ${circle(218, 88, 18, "pv-accent-ring")}
    ${circle(218, 88, 4, "pv-accent")}
  `,
  "noise-light-mesh": () => `
    ${path("M14 152 L72 34 L132 116 L192 18 L248 112 L310 46", "pv-muted-line")}
    ${path("M14 152 L132 116 L248 112 M72 34 L192 18 L310 46 M72 34 L132 116 L192 18 L248 112 L310 46", "pv-line")}
    ${circle(192, 18, 22, "pv-glow")}
    ${circle(132, 116, 5, "pv-accent")}
    ${circle(248, 112, 4, "pv-accent-2")}
  `,
  "topographic-pulse-map": () => `
    ${path("M20 116 C44 70 78 72 100 104 S150 148 176 104 S232 50 302 92", "pv-muted-line")}
    ${path("M14 130 C40 78 76 82 98 116 S152 158 184 112 S238 62 308 104", "pv-line")}
    ${path("M26 100 C48 60 80 60 106 90 S154 128 170 94 S226 38 294 78", "pv-muted-line")}
    ${path("M54 86 C72 70 92 72 110 94 S146 116 160 94", "pv-accent-line")}
    ${circle(160, 94, 5, "pv-accent")}
  `,
  "particle-constellation": () => `
    ${line(42, 120, 86, 58, "pv-muted-line")}
    ${line(86, 58, 148, 88, "pv-line")}
    ${line(148, 88, 208, 34, "pv-muted-line")}
    ${line(148, 88, 238, 130, "pv-line")}
    ${line(238, 130, 286, 70, "pv-muted-line")}
    ${line(208, 34, 286, 70, "pv-line")}
    ${circle(42, 120, 4, "pv-fill")}${circle(86, 58, 6, "pv-accent")}
    ${circle(148, 88, 5, "pv-fill")}${circle(208, 34, 4, "pv-accent-2")}
    ${circle(238, 130, 7, "pv-accent")}${circle(286, 70, 4, "pv-fill")}
  `,
  "liquid-lens-field": () => `
    ${circle(84, 88, 54, "pv-surface")}
    ${circle(172, 70, 64, "pv-accent-soft")}
    ${circle(244, 112, 48, "pv-accent-2-soft")}
    ${circle(172, 70, 40, "pv-accent-ring")}
    ${path("M36 96 C104 20 202 150 292 50", "pv-line")}
  `,
  "vector-flow-field": () => `
    ${[22, 44, 66, 88, 110, 132, 154]
      .map((y, index) =>
        path(
          `M12 ${y} C74 ${y - 28 + index * 3} 112 ${y + 34 - index * 4} 168 ${y} S260 ${y - 34 + index * 5} 310 ${y - 8}`,
          index === 3 ? "pv-accent-line" : "pv-muted-line",
        ),
      )
      .join("")}
    ${path("M284 70 L306 80 L286 91", "pv-accent-line")}
  `,
  "halftone-light-field": () => `
    ${dotField({ columns: 15, rows: 8, startX: 12, startY: 14, gapX: 21, gapY: 21, radius: 1.6 })}
    ${circle(218, 78, 46, "pv-glow")}
    ${circle(218, 78, 17, "pv-accent-soft")}
  `,
  "paper-cut-terrain": () => `
    ${path("M0 118 C44 92 80 108 124 76 C172 42 202 92 246 58 C278 34 302 42 330 24 L330 180 L0 180 Z", "pv-muted-fill")}
    ${path("M0 138 C56 96 90 132 138 96 C186 60 226 118 270 80 C292 62 310 66 330 54 L330 180 L0 180 Z", "pv-surface")}
    ${path("M0 156 C58 126 106 156 154 124 C204 92 244 146 294 108 C308 98 320 98 330 96 L330 180 L0 180 Z", "pv-accent-soft")}
  `,
  "pixel-weather-map": () => `
    ${Array.from({ length: 54 }, (_, index) => {
      const column = index % 9;
      const row = Math.floor(index / 9);
      const strength = (column * 3 + row * 5) % 11;
      const className =
        strength > 8 ? "pv-accent" : strength > 5 ? "pv-accent-2" : "pv-muted-fill";
      return rect(37 + column * 28, 14 + row * 27, 21, 20, className, 2);
    }).join("")}
    ${path("M54 128 C100 90 158 130 196 82 S262 60 292 38", "pv-line")}
  `,

  "kinetic-mask-heading": () => `
    ${label(26, 72, "MOVE", "pv-display")}
    ${label(26, 125, "WITH INTENT", "pv-display-small")}
    ${rect(146, 32, 84, 52, "pv-accent", 0)}
    ${rect(178, 88, 114, 8, "pv-accent-2", 0)}
  `,
  "variable-font-wave": () => `
    ${label(24, 106, "VARIABLE", "pv-display-wide")}
    ${path("M20 122 C82 82 128 156 194 112 S278 76 310 102", "pv-accent-line")}
    ${label(46, 145, "thin   regular   bold", "pv-mono")}
  `,
  "path-marquee": () => `
    ${path("M-16 118 C58 22 126 164 208 64 C246 18 286 20 340 74", "pv-muted-line")}
    ${label(26, 103, "STORY  /  MOTION  /  SIGNAL", "pv-type-path")}
    ${circle(218, 62, 7, "pv-accent")}
  `,
  "semantic-scramble-reveal": () => `
    ${label(30, 60, "D3S?GN", "pv-display-small")}
    ${label(30, 102, "DESIGN", "pv-display")}
    ${line(30, 120, 284, 120, "pv-muted-line")}
    ${rect(30, 132, 152, 7, "pv-accent", 0)}
  `,
  "typographic-cutout-window": () => `
    ${rect(24, 22, 272, 136, "pv-fill", 3)}
    ${label(44, 118, "OPEN", "pv-display-cutout")}
    ${circle(246, 56, 22, "pv-accent")}
  `,
  "counter-cascade": () => `
    ${label(34, 62, "08", "pv-counter-muted")}
    ${label(112, 92, "24", "pv-counter")}
    ${label(214, 126, "64", "pv-counter-accent")}
    ${line(34, 144, 288, 144, "pv-muted-line")}
  `,
  "glyph-cascade": () => `
    ${label(32, 62, "A", "pv-glyph")}
    ${label(90, 88, "↗", "pv-glyph-accent")}
    ${label(150, 116, "◎", "pv-glyph")}
    ${label(222, 142, "M", "pv-glyph-muted")}
  `,
  "outline-echo-heading": () => `
    ${label(30, 75, "ECHO", "pv-outline-type-muted")}
    ${label(34, 96, "ECHO", "pv-outline-type")}
    ${label(38, 117, "ECHO", "pv-display-small")}
    ${rect(240, 42, 42, 42, "pv-accent", 21)}
  `,
  "scroll-weave-sentence": () => `
    ${label(26, 54, "BUILD", "pv-display-small")}
    ${label(126, 88, "ideas", "pv-serif")}
    ${label(52, 132, "THAT MOVE", "pv-display-small")}
    ${path("M24 74 C92 42 130 142 198 104 S264 54 304 86", "pv-accent-line")}
  `,
  "word-orbit-cloud": () => `
    ${circle(160, 90, 52, "pv-accent-ring")}
    ${label(126, 95, "CORE", "pv-type-strong")}
    ${label(44, 50, "FORM", "pv-mono")}
    ${label(242, 62, "FLOW", "pv-mono")}
    ${label(54, 144, "SPACE", "pv-mono")}
    ${label(232, 142, "TYPE", "pv-mono")}
    ${circle(160, 38, 5, "pv-accent")}${circle(208, 112, 4, "pv-accent-2")}
  `,

  "magnetic-cta": () => `
    ${rect(72, 55, 176, 70, "pv-surface", 35)}
    ${label(108, 97, "EXPLORE", "pv-button-type")}
    ${circle(226, 90, 11, "pv-accent")}
    ${path("M270 38 C238 48 232 62 226 78", "pv-muted-line")}
    ${circle(272, 36, 4, "pv-fill")}
  `,
  "liquid-fill-button": () => `
    ${rect(58, 56, 204, 70, "pv-surface", 35)}
    ${path("M58 100 C102 70 138 126 184 94 S238 78 262 88 L262 126 L58 126 Z", "pv-accent")}
    ${label(116, 98, "LAUNCH", "pv-button-type")}
  `,
  "split-label-arrow-button": () => `
    ${rect(58, 59, 204, 62, "pv-surface", 4)}
    ${line(210, 59, 210, 121, "pv-muted-line")}
    ${label(78, 96, "DISCOVER", "pv-button-type")}
    ${path("M230 78 L244 90 L230 102", "pv-accent-line")}
  `,
  "elastic-icon-switch": () => `
    ${rect(84, 64, 152, 54, "pv-surface", 27)}
    ${circle(112, 91, 20, "pv-muted-fill")}
    ${path("M105 91 L111 97 L122 83", "pv-muted-line")}
    ${circle(208, 91, 22, "pv-accent")}
    ${line(142, 91, 176, 91, "pv-accent-line")}
  `,
  "orbit-icon-button": () => `
    ${circle(160, 90, 52, "pv-surface")}
    ${circle(160, 90, 28, "pv-accent-ring")}
    ${circle(204, 62, 8, "pv-accent")}
    ${path("M145 91 L158 104 L180 76", "pv-line")}
  `,
  "pressure-depth-button": () => `
    ${rect(70, 72, 180, 64, "pv-muted-fill", 8)}
    ${rect(70, 54, 180, 64, "pv-surface", 8)}
    ${line(70, 118, 70, 136, "pv-muted-line")}${line(250, 118, 250, 136, "pv-muted-line")}
    ${label(112, 92, "PRESS", "pv-button-type")}
    ${rect(210, 72, 18, 9, "pv-accent", 4)}
  `,
  "halo-border-cta": () => `
    ${rect(58, 53, 204, 74, "pv-accent-ring", 37)}
    ${rect(64, 59, 192, 62, "pv-surface", 31)}
    ${circle(80, 70, 5, "pv-accent")}
    ${label(112, 96, "ENTER", "pv-button-type")}
  `,
  "radial-choice-cluster": () => `
    ${circle(160, 90, 34, "pv-surface")}
    ${label(145, 94, "GO", "pv-button-type")}
    ${circle(160, 28, 18, "pv-accent")}
    ${circle(222, 58, 18, "pv-surface")}
    ${circle(224, 128, 18, "pv-surface")}
    ${circle(98, 128, 18, "pv-surface")}
    ${circle(96, 56, 18, "pv-surface")}
    ${line(160, 56, 160, 46, "pv-muted-line")}${line(190, 74, 206, 64, "pv-muted-line")}
  `,

  "tilt-spotlight-card": () => `
    ${path("M70 38 L250 24 L266 140 L86 156 Z", "pv-surface")}
    ${circle(212, 56, 42, "pv-glow")}
    ${rect(104, 68, 92, 10, "pv-fill", 2)}
    ${rect(104, 88, 126, 6, "pv-muted-fill", 2)}
    ${rect(104, 104, 88, 6, "pv-muted-fill", 2)}
  `,
  "peel-away-card": () => `
    ${rect(70, 34, 180, 126, "pv-surface", 8)}
    ${path("M198 34 L250 34 L250 86 Z", "pv-accent")}
    ${path("M198 34 L198 86 L250 86", "pv-line")}
    ${rect(92, 66, 82, 10, "pv-fill", 2)}
    ${rect(92, 90, 112, 7, "pv-muted-fill", 2)}
  `,
  "depth-stack-card": () => `
    ${rect(94, 30, 170, 110, "pv-muted-fill", 8)}
    ${rect(76, 42, 170, 110, "pv-accent-2-soft", 8)}
    ${rect(58, 56, 170, 110, "pv-surface", 8)}
    ${rect(80, 82, 92, 11, "pv-fill", 2)}
    ${circle(198, 92, 12, "pv-accent")}
  `,
  "cursor-reveal-comparison-card": () => `
    ${rect(52, 36, 216, 128, "pv-muted-fill", 8)}
    ${rect(52, 36, 112, 128, "pv-surface", 8)}
    ${line(164, 42, 164, 158, "pv-accent-line")}
    ${circle(164, 100, 12, "pv-accent")}
    ${label(76, 148, "BEFORE", "pv-mono")}${label(194, 148, "AFTER", "pv-mono")}
  `,
  "expandable-story-card": () => `
    ${rect(52, 58, 216, 86, "pv-surface", 8)}
    ${rect(52, 30, 216, 62, "pv-accent-soft", 8)}
    ${label(74, 68, "01", "pv-counter-small")}
    ${rect(116, 50, 104, 10, "pv-fill", 2)}
    ${rect(74, 112, 152, 6, "pv-muted-fill", 2)}
  `,
  "holographic-identity-card": () => `
    ${path("M62 48 L244 30 L264 132 L82 150 Z", "pv-accent-2-soft")}
    ${circle(126, 86, 22, "pv-accent")}
    ${rect(162, 70, 70, 9, "pv-fill", 2)}
    ${rect(162, 88, 48, 6, "pv-muted-fill", 2)}
    ${line(92, 126, 226, 112, "pv-accent-line")}
  `,
  "timeline-fold-card": () => `
    ${rect(44, 56, 232, 92, "pv-surface", 7)}
    ${path("M118 56 L138 148", "pv-muted-line")}
    ${path("M202 56 L182 148", "pv-muted-line")}
    ${circle(78, 92, 9, "pv-accent")}
    ${circle(160, 100, 9, "pv-accent-2")}
    ${circle(238, 88, 9, "pv-fill")}
    ${line(78, 92, 238, 88, "pv-muted-line")}
  `,
  "shimmer-edge-feature": () => `
    ${rect(54, 36, 212, 128, "pv-surface", 10)}
    ${path("M54 118 L54 46 Q54 36 64 36 L178 36", "pv-accent-line-wide")}
    ${circle(178, 36, 7, "pv-glow")}
    ${rect(80, 68, 112, 12, "pv-fill", 2)}
    ${rect(80, 94, 154, 7, "pv-muted-fill", 2)}
  `,
  "spatial-bento-cell": () => `
    ${rect(38, 38, 108, 60, "pv-surface", 7)}
    ${rect(156, 38, 126, 96, "pv-accent-soft", 7)}
    ${rect(38, 108, 108, 46, "pv-muted-fill", 7)}
    ${circle(218, 82, 22, "pv-accent-ring")}
    ${rect(56, 58, 56, 8, "pv-fill", 2)}
  `,

  "morphing-island-nav": () => `
    ${rect(62, 34, 196, 42, "pv-surface", 21)}
    ${circle(84, 55, 8, "pv-accent")}
    ${rect(106, 51, 48, 7, "pv-fill", 3)}
    ${rect(74, 90, 172, 60, "pv-surface", 16)}
    ${rect(94, 108, 52, 8, "pv-muted-fill", 3)}
    ${rect(94, 126, 92, 7, "pv-muted-fill", 3)}
  `,
  "editorial-rail-menu": () => `
    ${line(62, 28, 62, 154, "pv-accent-line")}
    ${label(82, 58, "INDEX", "pv-mono")}
    ${label(82, 90, "PROJECTS", "pv-display-small")}
    ${label(82, 120, "STUDIO", "pv-display-small-muted")}
    ${label(82, 148, "CONTACT", "pv-display-small-muted")}
    ${label(40, 150, "03", "pv-mono")}
  `,
  "command-dock": () => `
    ${rect(42, 110, 236, 44, "pv-surface", 12)}
    ${circle(70, 132, 10, "pv-accent")}
    ${rect(94, 126, 64, 10, "pv-muted-fill", 4)}
    ${circle(190, 132, 12, "pv-muted-fill")}
    ${circle(224, 132, 12, "pv-muted-fill")}
    ${circle(258, 132, 12, "pv-accent-2")}
  `,
  "magnetic-mega-menu": () => `
    ${rect(38, 28, 244, 124, "pv-surface", 6)}
    ${label(58, 54, "MENU / 04", "pv-mono")}
    ${label(58, 88, "WORK", "pv-display-small")}
    ${label(58, 116, "ABOUT", "pv-display-small-muted")}
    ${rect(194, 52, 62, 70, "pv-accent-soft", 4)}
    ${circle(224, 82, 8, "pv-accent")}
  `,
  "ribbon-chapter-nav": () => `
    ${path("M20 110 C70 46 112 144 166 82 S248 42 304 84", "pv-wide-accent")}
    ${circle(68, 78, 7, "pv-surface")}${circle(166, 82, 7, "pv-surface")}${circle(268, 66, 7, "pv-surface")}
    ${label(52, 142, "01", "pv-mono")}${label(152, 142, "02", "pv-mono")}${label(254, 142, "03", "pv-mono")}
  `,
  "radial-context-menu": () => `
    ${circle(160, 90, 24, "pv-accent")}
    ${circle(160, 36, 16, "pv-surface")}
    ${circle(214, 60, 16, "pv-surface")}
    ${circle(220, 120, 16, "pv-surface")}
    ${circle(106, 120, 16, "pv-surface")}
    ${circle(104, 60, 16, "pv-surface")}
    ${line(160, 66, 160, 52, "pv-muted-line")}${line(181, 77, 199, 66, "pv-muted-line")}
  `,
  "breadcrumb-motion-track": () => `
    ${line(34, 90, 286, 90, "pv-muted-line")}
    ${circle(48, 90, 8, "pv-fill")}${circle(126, 90, 8, "pv-accent")}${circle(206, 90, 8, "pv-muted-fill")}${circle(278, 90, 8, "pv-muted-fill")}
    ${label(34, 124, "HOME", "pv-mono")}${label(108, 124, "WORK", "pv-mono")}${label(192, 124, "CASE", "pv-mono")}
    ${path("M116 54 L126 44 L136 54", "pv-accent-line")}
  `,
  "split-screen-menu": () => `
    ${rect(20, 22, 280, 136, "pv-surface", 5)}
    ${rect(160, 22, 140, 136, "pv-accent-soft", 0)}
    ${label(42, 62, "01  WORK", "pv-type-strong")}
    ${label(42, 94, "02  STUDIO", "pv-type")}
    ${label(42, 126, "03  CONTACT", "pv-type")}
    ${circle(230, 90, 32, "pv-accent-ring")}
  `,

  "product-orbit-hero": () => `
    ${label(24, 48, "NEXT", "pv-display-small")}
    ${label(24, 76, "OBJECT", "pv-display-small")}
    ${circle(224, 92, 48, "pv-accent-ring")}
    ${circle(224, 92, 24, "pv-surface")}
    ${circle(268, 62, 8, "pv-accent")}
    ${path("M166 92 C166 54 194 32 224 32 C260 32 286 56 286 92", "pv-muted-line")}
    ${rect(24, 112, 88, 26, "pv-accent", 13)}
  `,
  "layered-narrative-hero": () => `
    ${rect(164, 26, 120, 118, "pv-accent-soft", 4)}
    ${rect(142, 52, 92, 92, "pv-surface", 4)}
    ${label(24, 52, "STORIES", "pv-display-small")}
    ${label(24, 82, "WITH DEPTH", "pv-display-small")}
    ${label(24, 126, "01 / 03", "pv-mono")}
    ${line(24, 142, 118, 142, "pv-accent-line")}
  `,
  "bento-signal-grid": () => `
    ${rect(22, 24, 122, 62, "pv-surface", 4)}
    ${rect(154, 24, 144, 96, "pv-accent-soft", 4)}
    ${rect(22, 96, 122, 60, "pv-muted-fill", 4)}
    ${rect(154, 130, 68, 26, "pv-accent", 4)}
    ${rect(232, 130, 66, 26, "pv-surface", 4)}
    ${label(38, 60, "SIGNAL", "pv-type-strong")}
  `,
  "pinned-feature-story": () => `
    ${rect(28, 24, 118, 132, "pv-accent-soft", 5)}
    ${label(164, 48, "01", "pv-counter-small")}
    ${label(164, 78, "PINNED", "pv-display-small")}
    ${rect(164, 94, 112, 7, "pv-muted-fill", 2)}
    ${rect(164, 110, 94, 7, "pv-muted-fill", 2)}
    ${rect(164, 132, 62, 20, "pv-accent", 10)}
  `,
  "logo-current-strip": () => `
    ${label(-6, 102, "LUMORA  •  FORM  •  MOTION  •  LUMORA", "pv-marquee")}
    ${line(22, 42, 298, 42, "pv-muted-line")}
    ${line(22, 136, 298, 136, "pv-muted-line")}
    ${circle(160, 42, 7, "pv-accent")}
  `,
  "masked-film-hero": () => `
    ${rect(20, 20, 280, 140, "pv-fill", 4)}
    ${circle(230, 76, 48, "pv-accent-soft")}
    ${label(36, 104, "FRAME", "pv-display-cutout-small")}
    ${rect(36, 122, 92, 6, "pv-accent", 0)}
  `,
  "exploded-product-hero": () => `
    ${circle(204, 90, 26, "pv-surface")}
    ${rect(196, 34, 16, 28, "pv-accent", 3)}
    ${rect(196, 118, 16, 28, "pv-accent-2", 3)}
    ${circle(150, 90, 12, "pv-muted-fill")}
    ${circle(258, 90, 12, "pv-muted-fill")}
    ${line(164, 90, 178, 90, "pv-muted-line")}${line(230, 90, 244, 90, "pv-muted-line")}
    ${label(28, 58, "BUILT", "pv-display-small")}${label(28, 88, "APART", "pv-display-small")}
    ${label(28, 124, "04 PARTS", "pv-mono")}
  `,
  "process-diagram-hero": () => `
    ${label(24, 48, "PROCESS", "pv-display-small")}
    ${circle(62, 112, 16, "pv-accent")}
    ${circle(156, 112, 16, "pv-surface")}
    ${circle(254, 112, 16, "pv-accent-2")}
    ${line(78, 112, 140, 112, "pv-muted-line")}${line(172, 112, 238, 112, "pv-muted-line")}
    ${label(48, 146, "01", "pv-mono")}${label(142, 146, "02", "pv-mono")}${label(240, 146, "03", "pv-mono")}
  `,
  "stacked-feature-deck": () => `
    ${rect(64, 30, 204, 96, "pv-muted-fill", 6)}
    ${rect(52, 44, 204, 96, "pv-accent-2-soft", 6)}
    ${rect(40, 58, 204, 96, "pv-surface", 6)}
    ${label(62, 90, "FEATURE 01", "pv-type-strong")}
    ${rect(62, 108, 114, 7, "pv-muted-fill", 2)}
    ${circle(218, 82, 10, "pv-accent")}
  `,

  "curtain-section-reveal": () => `
    ${rect(18, 22, 142, 136, "pv-accent-soft", 0)}
    ${rect(160, 22, 142, 136, "pv-surface", 0)}
    ${path("M142 22 C176 58 144 120 176 158", "pv-accent-line")}
    ${label(112, 96, "OPEN", "pv-type-strong")}
  `,
  "parallax-type-image-pair": () => `
    ${imageFrame(174, 26, 112, 128, "pv-accent-soft")}
    ${label(28, 76, "MOVE", "pv-display-small")}
    ${label(60, 112, "DEEPER", "pv-display-small")}
    ${line(28, 132, 142, 132, "pv-accent-line")}
  `,
  "scroll-scrub-timeline": () => `
    ${line(34, 90, 286, 90, "pv-muted-line")}
    ${rect(34, 86, 148, 8, "pv-accent", 4)}
    ${circle(182, 90, 10, "pv-accent")}
    ${circle(252, 90, 7, "pv-muted-fill")}
    ${label(34, 58, "00:18", "pv-counter-small")}
    ${label(236, 130, "01:00", "pv-mono")}
  `,
  "view-transition-portal": () => `
    ${rect(38, 38, 110, 104, "pv-surface", 6)}
    ${rect(172, 38, 110, 104, "pv-accent-soft", 6)}
    ${path("M128 90 C148 54 174 54 192 90 C174 126 148 126 128 90 Z", "pv-accent")}
    ${path("M134 90 L184 90", "pv-line")}
  `,
  "horizontal-story-track": () => `
    ${rect(16, 42, 92, 96, "pv-surface", 5)}
    ${rect(118, 42, 92, 96, "pv-accent-soft", 5)}
    ${rect(220, 42, 92, 96, "pv-surface", 5)}
    ${label(30, 70, "01", "pv-counter-small")}${label(132, 70, "02", "pv-counter-small")}
    ${path("M250 154 L286 154 L276 144 M286 154 L276 164", "pv-accent-line")}
  `,
  "image-zoom-chapter": () => `
    ${imageFrame(44, 24, 232, 132, "pv-surface")}
    ${rect(112, 54, 96, 74, "pv-accent-ring", 2)}
    ${path("M244 42 L264 42 L264 62 M76 138 L56 138 L56 118", "pv-accent-line")}
  `,
  "text-wipe-progress": () => `
    ${label(28, 78, "PROGRESS", "pv-display-small-muted")}
    ${rect(28, 48, 162, 42, "pv-accent-soft", 0)}
    ${label(28, 78, "PROGRESS", "pv-display-small")}
    ${line(28, 116, 286, 116, "pv-muted-line")}
    ${rect(28, 112, 162, 8, "pv-accent", 4)}
  `,
  "sticky-comparison-rail": () => `
    ${rect(26, 28, 118, 124, "pv-surface", 5)}
    ${rect(176, 28, 118, 124, "pv-accent-soft", 5)}
    ${line(160, 28, 160, 152, "pv-accent-line")}
    ${circle(160, 90, 12, "pv-accent")}
    ${label(54, 138, "THEN", "pv-mono")}${label(214, 138, "NOW", "pv-mono")}
  `,

  "chromatic-cursor-trail": () => `
    ${path("M42 138 C82 72 134 148 176 82 S242 42 286 68", "pv-accent-line-wide")}
    ${path("M48 146 C88 80 140 156 182 90 S248 50 292 76", "pv-accent-2-line")}
    ${path("M178 42 L178 90 L210 72 Z", "pv-fill")}
  `,
  "magnetic-media-lens": () => `
    ${imageFrame(38, 26, 244, 130, "pv-surface")}
    ${circle(198, 88, 42, "pv-accent-ring")}
    ${circle(198, 88, 30, "pv-accent-soft")}
    ${line(228, 118, 250, 140, "pv-accent-line-wide")}
  `,
  "draggable-coverflow": () => `
    ${path("M26 52 L112 38 L120 142 L34 154 Z", "pv-muted-fill")}
    ${rect(112, 22, 98, 136, "pv-surface", 5)}
    ${path("M210 38 L296 52 L288 154 L202 142 Z", "pv-accent-soft")}
    ${line(132, 138, 190, 138, "pv-accent-line")}
  `,
  "infinite-ribbon-gallery": () => `
    ${path("M-20 122 C54 48 112 148 184 78 S278 52 344 96", "pv-wide-accent")}
    ${rect(38, 62, 52, 40, "pv-surface", 3)}
    ${rect(126, 92, 60, 44, "pv-surface", 3)}
    ${rect(220, 48, 56, 42, "pv-surface", 3)}
  `,
  "image-trail-gallery": () => `
    ${rect(42, 94, 72, 58, "pv-muted-fill", 4)}
    ${rect(94, 68, 80, 64, "pv-accent-soft", 4)}
    ${rect(154, 42, 88, 70, "pv-surface", 4)}
    ${rect(220, 24, 62, 50, "pv-accent-2-soft", 4)}
    ${path("M38 148 C92 118 142 72 270 40", "pv-muted-line")}
  `,
  "pixelate-reveal-gallery": () => `
    ${rect(32, 26, 256, 128, "pv-surface", 5)}
    ${Array.from({ length: 24 }, (_, index) => {
      const column = index % 6;
      const row = Math.floor(index / 6);
      return rect(
        162 + column * 21,
        48 + row * 21,
        16,
        16,
        (column + row) % 3 === 0 ? "pv-accent" : "pv-muted-fill",
        1,
      );
    }).join("")}
    ${line(152, 36, 152, 144, "pv-accent-line")}
  `,
  "draggable-mosaic": () => `
    ${rect(28, 30, 80, 52, "pv-surface", 4)}
    ${rect(118, 30, 64, 88, "pv-accent-soft", 4)}
    ${rect(192, 30, 100, 42, "pv-surface", 4)}
    ${rect(28, 92, 80, 58, "pv-accent-2-soft", 4)}
    ${rect(192, 82, 100, 68, "pv-muted-fill", 4)}
    ${path("M148 128 L158 144 L166 132", "pv-accent-line")}
  `,
  "cursor-label-preview": () => `
    ${rect(42, 32, 236, 116, "pv-surface", 5)}
    ${label(64, 64, "PROJECT 04", "pv-mono")}
    ${label(64, 104, "HOVER", "pv-display-small")}
    ${path("M214 76 L214 122 L246 103 Z", "pv-fill")}
    ${rect(224, 124, 70, 22, "pv-accent", 11)}
    ${label(238, 139, "VIEW", "pv-mono-dark")}
  `,

  "focus-halo-field": () => `
    ${rect(52, 62, 216, 56, "pv-surface", 7)}
    ${rect(46, 56, 228, 68, "pv-accent-ring", 10)}
    ${label(72, 96, "EMAIL ADDRESS", "pv-mono")}
    ${circle(244, 90, 7, "pv-accent")}
  `,
  "progressive-form-stepper": () => `
    ${circle(58, 42, 14, "pv-accent")}${circle(160, 42, 14, "pv-surface")}${circle(262, 42, 14, "pv-muted-fill")}
    ${line(72, 42, 146, 42, "pv-accent-line")}${line(174, 42, 248, 42, "pv-muted-line")}
    ${rect(58, 82, 204, 22, "pv-surface", 5)}
    ${rect(58, 116, 136, 22, "pv-surface", 5)}
    ${rect(208, 116, 54, 22, "pv-accent", 11)}
  `,
  "morphing-async-status": () => `
    ${circle(92, 90, 32, "pv-accent-ring")}
    ${path("M78 90 L88 100 L108 78", "pv-accent-line-wide")}
    ${rect(142, 74, 118, 12, "pv-fill", 3)}
    ${rect(142, 96, 82, 7, "pv-muted-fill", 3)}
    ${circle(274, 90, 5, "pv-accent")}
  `,
  "elastic-search-command": () => `
    ${rect(40, 62, 240, 56, "pv-surface", 28)}
    ${circle(72, 88, 12, "pv-accent-ring")}
    ${line(80, 98, 90, 108, "pv-accent-line")}
    ${label(108, 94, "SEARCH COMMANDS", "pv-mono")}
    ${rect(240, 78, 24, 20, "pv-muted-fill", 5)}
    ${label(247, 92, "/", "pv-mono")}
  `,
  "narrative-slider-control": () => `
    ${label(38, 52, "INTENSITY", "pv-mono")}
    ${line(42, 98, 278, 98, "pv-muted-line")}
    ${rect(42, 94, 146, 8, "pv-accent", 4)}
    ${circle(188, 98, 15, "pv-accent")}
    ${label(42, 132, "QUIET", "pv-mono")}${label(240, 132, "LOUD", "pv-mono")}
  `,
  "upload-drop-reactor": () => `
    ${rect(52, 34, 216, 120, "pv-accent-ring-dashed", 9)}
    ${path("M160 64 L160 112 M142 82 L160 64 L178 82", "pv-accent-line-wide")}
    ${label(104, 136, "DROP TO UPLOAD", "pv-mono")}
  `,
  "success-signal-burst": () => `
    ${circle(160, 90, 36, "pv-accent")}
    ${path("M142 90 L154 102 L180 76", "pv-line-dark")}
    ${[0, 45, 90, 135, 180, 225, 270, 315]
      .map((angle) => {
        const radians = (angle * Math.PI) / 180;
        return line(
          160 + Math.cos(radians) * 54,
          90 + Math.sin(radians) * 54,
          160 + Math.cos(radians) * 72,
          90 + Math.sin(radians) * 72,
          angle % 90 === 0 ? "pv-accent-line" : "pv-accent-2-line",
        );
      })
      .join("")}
  `,

  "orbital-metric-cluster": () => `
    ${circle(160, 90, 54, "pv-accent-ring")}
    ${circle(160, 90, 28, "pv-surface")}
    ${label(142, 96, "72", "pv-counter-small")}
    ${circle(160, 36, 8, "pv-accent")}${circle(208, 118, 7, "pv-accent-2")}${circle(110, 120, 6, "pv-fill")}
    ${label(234, 62, "+18%", "pv-mono")}
  `,
  "shader-product-pedestal": () => `
    ${path("M88 132 L160 96 L232 132 L160 168 Z", "pv-muted-fill")}
    ${path("M126 74 L160 54 L194 74 L160 96 Z", "pv-accent")}
    ${path("M126 74 L160 96 L160 136 L126 112 Z", "pv-surface")}
    ${path("M194 74 L160 96 L160 136 L194 112 Z", "pv-accent-2-soft")}
    ${circle(160, 86, 58, "pv-glow")}
  `,
  "particle-data-globe": () => `
    ${circle(160, 90, 62, "pv-accent-ring")}
    ${path("M98 90 C122 64 198 64 222 90 C198 116 122 116 98 90", "pv-muted-line")}
    ${path("M160 28 C132 56 132 124 160 152 C188 124 188 56 160 28", "pv-muted-line")}
    ${dotField({ columns: 7, rows: 4, startX: 100, startY: 54, gapX: 20, gapY: 24, radius: 2.2 })}
  `,
  "isometric-process-scene": () => `
    ${path("M42 114 L96 84 L150 114 L96 144 Z", "pv-surface")}
    ${path("M134 78 L188 48 L242 78 L188 108 Z", "pv-accent-soft")}
    ${path("M190 130 L238 104 L286 130 L238 156 Z", "pv-muted-fill")}
    ${path("M114 92 L146 76 M206 100 L224 112", "pv-accent-line")}
    ${circle(96, 112, 8, "pv-accent")}${circle(188, 76, 8, "pv-accent-2")}
  `,
  "morphing-chart-story": () => `
    ${line(36, 148, 290, 148, "pv-muted-line")}
    ${barChart([38, 66, 52, 94, 72, 112], { x: 48, y: 148, width: 24, gap: 14 })}
    ${path("M48 110 C86 72 120 112 158 66 S228 86 272 34", "pv-accent-line-wide")}
    ${circle(272, 34, 6, "pv-accent")}
  `,
  "layered-network-map": () => `
    ${line(44, 124, 104, 62, "pv-muted-line")}${line(104, 62, 166, 94, "pv-line")}
    ${line(166, 94, 226, 44, "pv-muted-line")}${line(166, 94, 260, 132, "pv-line")}
    ${line(104, 62, 70, 30, "pv-muted-line")}${line(226, 44, 284, 72, "pv-muted-line")}
    ${circle(44, 124, 9, "pv-surface")}${circle(104, 62, 12, "pv-accent")}${circle(166, 94, 14, "pv-surface")}
    ${circle(226, 44, 9, "pv-accent-2")}${circle(260, 132, 11, "pv-fill")}${circle(284, 72, 6, "pv-muted-fill")}
  `,
  "scrollytelling-data-canvas": () => `
    ${rect(28, 24, 176, 132, "pv-surface", 5)}
    ${barChart([26, 48, 72, 58], { x: 48, y: 132, width: 24, gap: 12 })}
    ${label(224, 50, "01", "pv-counter-small")}
    ${rect(224, 70, 66, 7, "pv-fill", 2)}
    ${rect(224, 88, 52, 6, "pv-muted-fill", 2)}
    ${rect(224, 112, 58, 22, "pv-accent", 11)}
  `,
  "holographic-model-viewer": () => `
    ${circle(160, 94, 64, "pv-accent-ring")}
    ${path("M160 44 L200 70 L188 122 L132 122 L120 70 Z", "pv-accent-soft")}
    ${path("M160 44 L160 92 L200 70 M160 92 L132 122 M160 92 L188 122 M160 92 L120 70", "pv-line")}
    ${path("M94 142 C128 158 196 158 226 140", "pv-accent-line")}
    ${circle(242, 44, 5, "pv-accent")}
  `,
};

function fallbackPreview(archetype) {
  const hash = [...archetype].reduce(
    (total, character) => (total * 31 + character.charCodeAt(0)) >>> 0,
    0,
  );
  const offset = hash % 58;
  return `
    ${rect(34, 34, 252, 112, "pv-surface", 6)}
    ${circle(76 + offset, 72, 24, "pv-accent")}
    ${rect(58, 112, 126 + (hash % 62), 8, "pv-muted-fill", 3)}
    ${path(`M34 ${138 - (hash % 24)} L286 ${52 + (hash % 40)}`, "pv-accent-line")}
  `;
}

export function componentPreviewMarkup(record) {
  const archetype = String(record?.id ?? "").split("--")[0];
  const renderer = previewRenderers[archetype];
  const artwork = renderer ? renderer() : fallbackPreview(archetype);

  return `
    <svg
      class="recipe-preview"
      viewBox="0 0 320 180"
      preserveAspectRatio="xMidYMid slice"
      focusable="false"
      aria-hidden="true"
      data-preview="${archetype}"
    >
      <rect width="320" height="180" class="pv-canvas" />
      <g>${artwork}</g>
    </svg>
  `;
}

export const componentPreviewIds = Object.freeze(Object.keys(previewRenderers));
export const componentPreviewCount = componentPreviewIds.length;
