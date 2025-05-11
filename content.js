// TTD

// 1) Check if this is a daily problem by checking the URL for 'envType=daily-question'
// 2) Check if the user has completed the problem (look for a submission)
// 3) If completed, inject a 'Share' button into the page
// 4) When clicked, copy a shareable message to the clipboard

(function() {
  // checks to see if its a daily problem
  function isDailyProblem() {
    return window.location.search.includes('envType=daily-question');
  }

  // function used to get the date from the url
  function getDailyDate() {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('envId');
    if (!raw) return '';
    const [yyyy, mm, dd] = raw.split('-');
    return `${parseInt(mm, 10)}/${parseInt(dd, 10)}/${yyyy.slice(2)}`;
  }

  // function to see if the user has completed the problem
  function hasAcceptedSubmission() {
    return !!document.querySelector('span.text-success, span.bg-green-s');
  }

  // share button
  function injectShareButtonsInDivList() {
    // header
    const headerRow = document.querySelector('.flex.h-8.items-center.border-b');
    if (headerRow && !headerRow.querySelector('.leetcode-daily-share-header')) {
      const headerChildren = Array.from(headerRow.children);
      const shareHeader = document.createElement('div');
      shareHeader.className = headerChildren[1].className + ' leetcode-daily-share-header flex items-center justify-center';
      shareHeader.style.width = '80px';
      shareHeader.textContent = 'Share';
      headerRow.insertBefore(shareHeader, headerChildren[1]);
    }
    

    // find submission and put in all the share buttons
    const rows = document.querySelectorAll('.group.flex.h-\\[48px\\]');
    if (!rows.length) return;
    rows.forEach(row => {
      if (row.querySelector('.leetcode-daily-share-btn')) return;
      const columnsContainer = row.querySelector('.flex.h-full.w-full.flex-shrink-0.items-center');
      if (!columnsContainer) return;
      const columns = Array.from(columnsContainer.children);
      if (columns.length < 6) return; 
      const shareDiv = document.createElement('div');
      shareDiv.className = columns[1].className + ' leetcode-daily-share-btn flex items-center justify-center';
      shareDiv.style.width = '80px';
      const btn = document.createElement('button');
      btn.textContent = 'Share';
      btn.style.background = '#ffa116';
      btn.style.color = '#fff';
      btn.style.border = 'none';
      btn.style.borderRadius = '4px';
      btn.style.padding = '4px 10px';
      btn.style.cursor = 'pointer';
      btn.onclick = async () => {
        // get envId for caching
        function getEnvIdFromUrl() {
          const params = new URLSearchParams(window.location.search);
          return params.get('envId') || '';
        }
        let envId = getEnvIdFromUrl();

        const lang = columns[2]?.innerText.trim();
        const runtime = columns[3]?.innerText.trim();
        let dailyLinkEl = document.querySelector('.text-title-large.font-semibold.text-text-primary a');
        let dailyLink;
        if (dailyLinkEl) {
          dailyLink = 'https://leetcode.com' + dailyLinkEl.getAttribute('href') + `description/?envType=daily-question&envId=${envId}`;
        } else {
          const url = new URL(window.location.href);
          const slugMatch = url.pathname.match(/\/problems\/([^/]+)/);
          if (slugMatch) {
            dailyLink = `https://leetcode.com/problems/${slugMatch[1]}/description/?envType=daily-question&envId=${envId}`;
          } else {
            dailyLink = window.location.href;
          }
        }

        // try and get difficulty from the DOM
        let difficulty = '';
        const badgeEls = document.querySelectorAll('div.bg-fill-secondary');
        for (const badge of badgeEls) {
          const txt = badge.textContent.trim().toLowerCase();
          if (badge.className.includes('text-difficulty-easy') || txt.includes('easy')) { difficulty = 'Easy'; break; }
          if (badge.className.includes('text-difficulty-medium') || txt.includes('medium')) { difficulty = 'Medium'; break; }
          if (badge.className.includes('text-difficulty-hard') || txt.includes('hard')) { difficulty = 'Hard'; break; }
        }
        // if not then find in description page
        if (!difficulty) {
          const url = new URL(window.location.href);
          const slugMatch = url.pathname.match(/\/problems\/([^/]+)/);
          if (slugMatch) {
            const descUrl = `https://leetcode.com/problems/${slugMatch[1]}/description/?envType=daily-question&envId=${envId}`;
            try {
              const resp = await fetch(descUrl, { credentials: 'include' });
              const html = await resp.text();
              const parser = new DOMParser();
              const doc = parser.parseFromString(html, 'text/html');
              const descBadges = doc.querySelectorAll('div.bg-fill-secondary');
              for (const badge of descBadges) {
                const txt = badge.textContent.trim().toLowerCase();
                if (badge.className.includes('text-difficulty-easy') || txt.includes('easy')) { difficulty = 'Easy'; break; }
                if (badge.className.includes('text-difficulty-medium') || txt.includes('medium')) { difficulty = 'Medium'; break; }
                if (badge.className.includes('text-difficulty-hard') || txt.includes('hard')) { difficulty = 'Hard'; break; }
              }
            } catch {}
          }
        }
        if (!difficulty) difficulty = 'Unknown';
        if (!dailyLink) {
          const url = new URL(window.location.href);
          const slugMatch = url.pathname.match(/\/problems\/([^/]+)/);
          if (slugMatch) {
            dailyLink = `https://leetcode.com/problems/${slugMatch[1]}/description/?envType=daily-question&envId=${envId}`;
          } else {
            dailyLink = window.location.href;
          }
        }

        // get date from url
        let dateStr = '';
        if (envId && envId.match(/^\d{4}-\d{2}-\d{2}$/)) {
          try {
            const [yyyy, mm, dd] = envId.split('-');
            const dateObj = new Date(Date.UTC(yyyy, mm - 1, dd));
            dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
          } catch {
            dateStr = envId;
          }
        } else {
          dateStr = envId;
        }

        //--------------- MARKDOWN TEMPLAET ---------------- //
        let shareText = `[**__LeetCode Daily__**](${dailyLink}) – ${dateStr}\n`;
        shareText += `  \n`;
        if (difficulty) shareText += `**Difficulty:** ${difficulty}\n`;
        if (lang) shareText += `**Language:** ${lang}  \n`;
        if (runtime) shareText += `**Runtime:** ${runtime}`;
        navigator.clipboard.writeText(shareText).then(() => {
          btn.textContent = 'Copied!';
          setTimeout(() => { btn.textContent = 'Share'; }, 1500);
        });
      };


      shareDiv.appendChild(btn);
      columnsContainer.insertBefore(shareDiv, columns[1]);
    });
  }

  function main() {
    if (!isDailyProblem()) return;
    injectShareButtonsInDivList();
  }

 
  main();
  let lastUrl = location.href;
  new MutationObserver(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      setTimeout(main, 500);
    } else {
      setTimeout(main, 500);
    }
  }).observe(document, {subtree: true, childList: true});
})(); 