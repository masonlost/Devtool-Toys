(() => {
  const STYLE_ID = "__dark_mode_style__";

  // Kill any previous instance so it doesn't stack
  document.getElementById(STYLE_ID)?.remove();

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    :root {
      filter: invert(1) hue-rotate(180deg) !important;
      background: #0f1115 !important;
      color-scheme: dark;
    }
    img, video, picture, canvas, iframe, svg,
    [style*="background-image"], .no-invert {
      filter: invert(1) hue-rotate(180deg) !important;
    }
  `;
  document.head.appendChild(style);

  console.log("Dark mode enabled");
})();
