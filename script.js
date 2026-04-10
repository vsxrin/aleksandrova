window.onload = () => {
  const objects = document.querySelectorAll('.object'); 
  const allElements = document.querySelectorAll('.image-container img, .project-desc'); 
  const centerRow = document.querySelector('.center-row');
  let focused = false;
  let placedElements = []; 

  const groupIds = Array.from(objects).map(obj => obj.id);

  function getGroup(el) {
    return groupIds.find(id => el.id === id || el.classList.contains(id));
  }

  function getSafePosition(el) {
    // --- THE FIX: MEASURE REAL HEIGHT ---
    // We temporarily remove the 'hidden' class to see the real height, then put it back
    const wasHidden = el.classList.contains('hidden');
    if (wasHidden) el.classList.remove('hidden');
    
    let w = el.offsetWidth;
    let h = el.offsetHeight;

    // Fallback if measurement still fails
    if (w === 0 || h === 0) {
      if (el.tagName === 'IMG') {
        const ratio = el.naturalHeight / el.naturalWidth || 1;
        w = 200; h = 200 * ratio;
      } else {
        w = 300; h = 300; // Safe guess for text
      }
    }

    if (wasHidden) el.classList.add('hidden');
    // ------------------------------------

    const margin = 60; 
    let tries = 0;
    let x, y, rect;

    const currentGroup = getGroup(el);
    const isCurrentMain = el.classList.contains('object');
    const isCurrentText = el.classList.contains('project-desc');

    while (tries < 1500) {
      x = margin + Math.random() * (window.innerWidth - w - margin * 2);
      y = margin + Math.random() * (window.innerHeight - h - margin * 2);
      rect = { left: x, right: x + w, top: y, bottom: y + h };

      const centerRect = centerRow.getBoundingClientRect();
      let barriers = [centerRect];

      placedElements.forEach(placed => {
        const placedGroup = getGroup(placed.el);
        const isPlacedMain = placed.el.classList.contains('object');
        const isPlacedText = placed.el.classList.contains('project-desc');

        if (isPlacedMain || isCurrentMain || currentGroup === placedGroup) {
          // STRICT for text: 0 overlap. Collage for images: 0.1 overlap.
          const bufferPercent = (isCurrentText || isPlacedText) ? 0 : 0;

          const bW = (placed.rect.right - placed.rect.left) * bufferPercent;
          const bH = (placed.rect.bottom - placed.rect.top) * bufferPercent;

          barriers.push({
            left: placed.rect.left + bW,
            right: placed.rect.right - bW,
            top: placed.rect.top + bH,
            bottom: placed.rect.bottom - bH
          });
        }
      });
      
      const overlap = barriers.some(r => (
        rect.left < r.right && rect.right > r.left &&
        rect.top < r.bottom && rect.bottom > r.top
      ));

      if (!overlap) return { x, y, rect };
      tries++;
    }
    return { x, y, rect }; 
  }

  // --- INITIAL POSITIONING ---
  allElements.forEach(el => {
    // Give images a moment to have naturalWidth/Height available
    if (el.tagName === 'IMG' && !el.complete) {
        el.onload = () => { /* wait */ };
    }
    
    const pos = getSafePosition(el);
    el.style.left = `${pos.x}px`;
    el.style.top = `${pos.y}px`;
    placedElements.push({ el: el, rect: pos.rect });
    
    if (!el.classList.contains('object')) {
      el.classList.add('hidden');
    }
  });

  // --- CLICK LOGIC (Your Original) ---
  objects.forEach(obj => {
    obj.addEventListener('click', (e) => {
      e.stopPropagation();
      const alreadyActive = obj.classList.contains('active');
      const relatedElements = document.querySelectorAll(`.${obj.id}`);

      objects.forEach(o => o.classList.remove('hidden', 'active'));
      allElements.forEach(el => {
        if (!el.classList.contains('object')) el.classList.add('hidden');
      });

      if (!alreadyActive) {
        obj.classList.add('active');
        objects.forEach(other => {
          if (other !== obj) other.classList.add('hidden');
        });
        relatedElements.forEach(el => el.classList.remove('hidden'));
        centerRow.classList.add('hidden');
        focused = true;
      } else {
        centerRow.classList.remove('hidden');
        focused = false;
      }
    });
  });

  document.body.addEventListener('click', () => {
    objects.forEach(o => o.classList.remove('hidden', 'active'));
    allElements.forEach(el => {
      if (!el.classList.contains('object')) el.classList.add('hidden');
    });
    centerRow.classList.remove('hidden');
    focused = false;
  });
};