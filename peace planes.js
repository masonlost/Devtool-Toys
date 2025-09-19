(() => {
  const plane = document.createElement("img");
  plane.src = "https://images.vexels.com/media/users/3/157012/isolated/preview/d48f8e1526ab66adf267168f4eedd00d-spy-airplane-top-view-silhouette.png";
  plane.style.position = "fixed";
  plane.style.width = "40px";       // smaller
  plane.style.height = "40px";
  plane.style.pointerEvents = "none";
  plane.style.opacity = "0.6";      // half transparent
  plane.style.zIndex = "9999";
  document.body.appendChild(plane);

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let planeX = mouseX, planeY = mouseY;
  let angle = 0;

  document.addEventListener("mousemove", e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  function animate() {
    const r = 70;       // orbit radius
    angle += 0.02;      // slower circling

    const targetX = mouseX + r * Math.cos(angle);
    const targetY = mouseY + r * Math.sin(angle);

    planeX += (targetX - planeX) * 0.02;  // gentler chase
    planeY += (targetY - planeY) * 0.02;

    const dx = targetX - planeX;
    const dy = targetY - planeY;
    const rot = Math.atan2(dy, dx) * 180 / Math.PI;

    // extra +90 to fix orientation
    plane.style.left = planeX - 20 + "px";
    plane.style.top  = planeY - 20 + "px";
    plane.style.transform = `rotate(${rot + 90}deg)`;

    requestAnimationFrame(animate);
  }
  animate();
})();
