/**
* Template Name: iPortfolio
* Template URL: https://bootstrapmade.com/iportfolio-bootstrap-portfolio-websites-template/
* Updated: Jun 29 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Construction Notice - Auto-push content down using document flow
   */
  function createConstructionNotice() {
    // Create construction bar - no positioning, pure document flow
    const constructionBar = document.createElement('div');
    constructionBar.className = 'construction-notice-flow';
    constructionBar.innerHTML = `
      <i class="bi bi-tools"></i>
      <span>This website is under construction - Some features may be incomplete</span>
      <i class="bi bi-hammer"></i>
    `;
    
    // Insert at very beginning of body to naturally push all content down
    document.body.insertBefore(constructionBar, document.body.firstChild);
    
    // Add CSS that doesn't use any positioning - pure document flow
    const style = document.createElement('style');
    style.textContent = `
      .construction-notice-flow {
        background: linear-gradient(135deg, #ff8c00 0%, #ff6b00 100%);
        color: white;
        text-align: center;
        padding: 3px 20px;
        font-size: 11px;
        font-weight: 600;
        box-shadow: 0 1px 5px rgba(255, 140, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        margin: 0;
        width: 100%;
        /* No position property - stays in document flow */
        z-index: 1002;
      }
      .construction-notice-flow i {
        font-size: 12px;
        animation: pulse 2s infinite;
      }
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.1); }
        100% { transform: scale(1); }
      }
      @media print {
        .construction-notice-flow {
          display: none;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // Initialize construction notice immediately
  createConstructionNotice();

  /**
   * Header toggle
   */
  const headerToggleBtn = document.querySelector('.header-toggle');

  function headerToggle() {
    document.querySelector('#header').classList.toggle('header-show');
    document.body.classList.toggle('header-mobile-open');
    headerToggleBtn.classList.toggle('bi-list');
    headerToggleBtn.classList.toggle('bi-x');
  }
  headerToggleBtn.addEventListener('click', headerToggle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', (e) => {
      // Close mobile nav if open
      if (document.querySelector('.header-show')) {
        headerToggle();
      }
      
      // Handle anchor links with smooth scrolling
      const href = navmenu.getAttribute('href');
      if (href && href.startsWith('#') && href !== '#') {
        const targetSection = document.querySelector(href);
        if (targetSection) {
          e.preventDefault();
          targetSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          // Update URL without page jump
          history.pushState(null, null, href);
        }
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Init typed.js
   */
  const selectTyped = document.querySelector('.typed');
  if (selectTyped) {
    let typed_strings = selectTyped.getAttribute('data-typed-items');
    typed_strings = typed_strings.split(',');
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Init typed.js for programming languages
   */
  const selectTypedLanguages = document.querySelector('.typed-languages');
  if (selectTypedLanguages) {
    let typed_languages_strings = selectTypedLanguages.getAttribute('data-typed-items');
    typed_languages_strings = typed_languages_strings.split(',');
    new Typed('.typed-languages', {
      strings: typed_languages_strings,
      loop: true,
      typeSpeed: 32,
      backSpeed: 16,
      backDelay: 600,
      startDelay: 3000
    });
  }

  /**
   * Initiate Pure Counter
   */
  window.addEventListener('load', async () => {
    const statsElements = document.querySelectorAll('#stats .purecounter');
    if (statsElements.length === 0) return;
    try {
      const [contributions, portfolio] = await Promise.all([
        fetch(`pull_requests.json?v=${Date.now()}`).then(response => response.json()),
        fetch(`portfolio/case-studies.json?v=${Date.now()}`).then(response => response.json())
      ]);
      const prs = contributions.pull_requests.filter(pr => pr.state === 'merged' && pr.merged_at);
      const counts = {
        'stat-merged-prs': prs.length,
        'stat-upstream-projects': new Set(prs.map(pr => pr.repository.full_name)).size,
        'stat-case-studies': portfolio.cases.length,
        'stat-issues-resolved': portfolio.cases.filter(item => item.kind === 'issue').length
      };
      Object.entries(counts).forEach(([id, count]) => {
        document.getElementById(id)?.setAttribute('data-purecounter-end', count);
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
    new PureCounter({
      selector: '#stats .purecounter'
    });
  });

  /**
   * Animate the skills items on reveal
   */
  let skillsAnimation = document.querySelectorAll('.skills-animation');
  skillsAnimation.forEach((item) => {
    new Waypoint({
      element: item,
      offset: '80%',
      handler: function(direction) {
        let progress = item.querySelectorAll('.progress .progress-bar');
        progress.forEach(el => {
          el.style.width = el.getAttribute('aria-valuenow') + '%';
        });
      }
    });
  });

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    // Skip the education section as it's handled by education-loader.js
    if (isotopeItem.closest('#portfolio')) {
      return;
    }
    
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
    
    // Load GitHub contribution data
    loadGitHubContributions();
    
    // Load projects for dropdown
    loadProjectsDropdown();
    
    // Initialize project navigation
    initProjectNavigation();
  });
  
  
  /**
   * Load projects JSON data with cache-busting
   */
  async function loadProjectsJson() {
    try {
      // Add cache-busting parameter to prevent caching issues
      const response = await fetch(`projects.json?v=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
      
    } catch (error) {
      console.error('Error loading projects:', error);
      throw error;
    }
  }
  
  /**
   * Load Projects for Navigation Dropdown
   */
  async function loadProjectsDropdown() {
    const dropdownElement = document.getElementById('projects-dropdown');
    
    if (!dropdownElement) {
      console.warn('Projects dropdown element not found');
      return;
    }
    
    try {
      const projects = await loadProjectsJson();
      
      if (!Array.isArray(projects)) {
        throw new Error(`Expected array, got ${typeof projects}`);
      }
      
      // Clear loading content
      dropdownElement.innerHTML = '';
      
      // Add featured projects first
      const featuredProjects = projects.filter(project => project.featured);
      const otherProjects = projects.filter(project => !project.featured);
      
      if (featuredProjects.length > 0) {
        // Add featured projects section
        featuredProjects.forEach(project => {
          const li = document.createElement('li');
          li.innerHTML = `<a href="#" data-project-id="${project.id}" class="project-link" title="${escapeHTML(project.description)}">
            <i class="bi bi-star"></i> ${project.name}
          </a>`;
          dropdownElement.appendChild(li);
        });
        
        // Add separator if there are other projects
        if (otherProjects.length > 0) {
          const separator = document.createElement('li');
          separator.innerHTML = '<hr class="dropdown-divider">';
          dropdownElement.appendChild(separator);
        }
      }
      
      // Add other projects
      otherProjects.forEach(project => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="#" data-project-id="${project.id}" class="project-link" title="${escapeHTML(project.description)}">
          <i class="bi bi-folder"></i> ${project.name}
        </a>`;
        dropdownElement.appendChild(li);
      });
      
      // Add "View All Projects" link at the bottom
      if (projects.length > 0) {
        const separator = document.createElement('li');
        separator.innerHTML = '<hr class="dropdown-divider">';
        dropdownElement.appendChild(separator);
        
        const viewAllLi = document.createElement('li');
        viewAllLi.innerHTML = `<a href="https://github.com/killerdevildog" target="_blank">
          <i class="bi bi-github"></i> View All Projects
        </a>`;
        dropdownElement.appendChild(viewAllLi);
      }
      
      // Add event listeners to project links
      const projectLinks = dropdownElement.querySelectorAll('.project-link');
      projectLinks.forEach(link => {
        link.addEventListener('click', function(e) {
          e.preventDefault();
          const projectId = this.getAttribute('data-project-id');
          loadProjectDetail(projectId);
        });
      });
      
    } catch (error) {
      console.error('Error loading projects for dropdown:', error);
      
      // Show error message in dropdown
      dropdownElement.innerHTML = `
        <li><a href="#" class="text-muted">
          <i class="bi bi-exclamation-triangle"></i> Projects failed to load
        </a></li>
        <li><hr class="dropdown-divider"></li>
        <li><a href="https://github.com/killerdevildog" target="_blank">
          <i class="bi bi-github"></i> View All Projects
        </a></li>
      `;
    }
  }

  /**
   * Load Project Detail Content
   */
  async function loadProjectDetail(projectId) {
    try {
      const projects = await loadProjectsJson();
      const project = projects.find(p => p.id === projectId);
      
      if (!project) {
        console.error('Project not found:', projectId);
        return;
      }
      
      // Hide main content sections
      const mainSections = document.querySelectorAll('#hero, #about, #stats, #skills, #resume, #portfolio, #pullrequests, #services, #testimonials, #contact');
      mainSections.forEach(section => {
        section.style.display = 'none';
      });
      
      // Show project detail section
      const projectDetailSection = document.getElementById('project-detail');
      projectDetailSection.style.display = 'block';
      
      // Generate project detail HTML
      const projectContent = document.getElementById('project-content');
      projectContent.innerHTML = generateProjectHTML(project);
      
      // Update page title
      document.title = `${project.title} - Quaylyn Rimer Portfolio`;
      
      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // Update URL without page reload
      history.pushState({ projectId: projectId }, project.title, `#project-${projectId}`);
      
    } catch (error) {
      console.error('Error loading project detail:', error);
    }
  }

  /**
   * Generate Project Detail HTML
   */
  function generateProjectHTML(project) {
    const prs = project.contributions.map(pr => `
      <li class="mb-3">
        <a href="${escapeHTML(pr.url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(pr.title)} (#${pr.number})</a>
        <div class="small">Merged ${escapeHTML(pr.merged_at.slice(0, 10))}</div>
      </li>`).join('');
    return `
      <div class="project-detail-content">
        <span class="badge bg-success mb-3">Accepted contributions</span>
        <h1>${escapeHTML(project.title)}</h1>
        <p class="lead">${escapeHTML(project.description)}</p>
        <p>My contribution: ${project.contributions.length} merged pull request${project.contributions.length === 1 ? '' : 's'}.</p>
        <h2>Merged changes</h2>
        <ul>${prs}</ul>
        <a href="${escapeHTML(project.githubUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">View upstream repository</a>
      </div>`;
  }

  /**
   * Get status color for badge
   */
  function getStatusColor(status) {
    switch(status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'planning': return 'info';
      default: return 'secondary';
    }
  }

  /**
   * Handle back button and browser navigation
   */
  function initProjectNavigation() {
    // Back button functionality
    const backButton = document.getElementById('back-to-main');
    if (backButton) {
      backButton.addEventListener('click', function() {
        showMainContent();
      });
    }
    
    // Handle browser back/forward buttons
    window.addEventListener('popstate', function(event) {
      if (event.state && event.state.projectId) {
        loadProjectDetail(event.state.projectId);
      } else {
        showMainContent();
      }
    });
    
    // Check URL on page load for direct project links
    if (window.location.hash.startsWith('#project-')) {
      const projectId = window.location.hash.replace('#project-', '');
      loadProjectDetail(projectId);
    }
  }

  /**
   * Show main portfolio content
   */
  function showMainContent() {
    // Hide project detail section
    const projectDetailSection = document.getElementById('project-detail');
    projectDetailSection.style.display = 'none';
    
    // Show main content sections
    const mainSections = document.querySelectorAll('#hero, #about, #stats, #skills, #resume, #portfolio, #pullrequests, #services, #testimonials, #contact');
    mainSections.forEach(section => {
      section.style.display = 'block';
    });
    
    // Reset page title
    document.title = 'Quayly Rimer -- Portfolio';
    
    // Update URL
    history.pushState({}, 'Portfolio', '/');
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * GitHub Activity Heatmap
   */
  async function loadGitHubContributions() {
    const username = 'killerdevildog'; // Your GitHub username
    const containerElement = document.getElementById('github-contributions-grid');
    const loadingElement = document.getElementById('github-contributions-loading');
    const errorElement = document.getElementById('github-contributions-error');
    
    if (!containerElement) return;
    
    try {
      // Start with loading state
      if (loadingElement) loadingElement.style.display = 'flex';
      if (errorElement) errorElement.style.display = 'none';
      if (containerElement) containerElement.style.display = 'none';
      
      // Fetch contribution data using GitHub's calendar endpoint
      const response = await fetch(`https://github-contributions-api.vercel.app/api/v1/${username}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GitHub contributions: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process contribution data
      renderContributionCalendar(data, containerElement);
      
      // Hide loading, show container
      if (loadingElement) loadingElement.style.display = 'none';
      if (containerElement) containerElement.style.display = 'block';
    } catch (error) {
      console.error('Error fetching GitHub contributions:', error);
      
      // Show error message
      if (loadingElement) loadingElement.style.display = 'none';
      if (errorElement) {
        errorElement.style.display = 'block';
        errorElement.textContent = `Unable to load GitHub contribution data: ${error.message}`;
      }
    }
  }
  
  function renderContributionCalendar(data, containerElement) {
    if (!data || !data.contributions || !containerElement) return;
    
    // Get all contributions
    const contributions = data.contributions;
    
    // Get min and max dates to determine the range
    const dates = Object.keys(contributions);
    const startDate = new Date(dates[0]);
    const endDate = new Date(dates[dates.length - 1]);
    
    // Find the maximum contribution count for scaling
    let maxContributions = 0;
    for (const date in contributions) {
      const count = contributions[date];
      if (count > maxContributions) {
        maxContributions = count;
      }
    }
    
    // Create the month labels
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthLabels = document.createElement('div');
    monthLabels.className = 'd-flex justify-content-between';
    monthLabels.style.marginBottom = '5px';
    
    // Add month labels based on date range
    let currentMonth = startDate.getMonth();
    for (let i = 0; i <= 11; i++) {
      const monthIndex = (currentMonth + i) % 12;
      const monthLabel = document.createElement('div');
      monthLabel.style.fontSize = '12px';
      monthLabel.style.color = '#adb5bd';
      monthLabel.style.flexBasis = '8.33%';
      monthLabel.style.textAlign = 'center';
      monthLabel.textContent = months[monthIndex];
      monthLabels.appendChild(monthLabel);
    }
    
    containerElement.appendChild(monthLabels);
    
    // Create the grid container
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(52, 1fr)';
    gridContainer.style.gridTemplateRows = 'repeat(7, 1fr)';
    gridContainer.style.gap = '3px';
    gridContainer.style.width = '100%';
    
    // Get the current date to start from
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    // Create cells for each day in the last year
    for (let week = 0; week < 52; week++) {
      for (let day = 0; day < 7; day++) {
        // Calculate the date for this cell (going backwards from now)
        const date = new Date(now);
        date.setDate(now.getDate() - (52 - week) * 7 - (6 - day));
        
        // Format date as YYYY-MM-DD
        const formattedDate = date.toISOString().split('T')[0];
        
        // Get contribution count for this date
        const count = contributions[formattedDate] || 0;
        
        // Determine color intensity based on contribution count
        const intensity = maxContributions > 0 ? Math.min(count / maxContributions * 4, 4) : 0;
        const cellColor = getCellColor(intensity);
        
        // Create the cell
        const cell = document.createElement('div');
        cell.style.width = '12px';
        cell.style.height = '12px';
        cell.style.backgroundColor = cellColor;
        cell.style.borderRadius = '2px';
        cell.style.cursor = 'pointer';
        cell.title = `${formattedDate}: ${count} contribution${count !== 1 ? 's' : ''}`;
        
        // Add hover effect
        cell.style.transition = 'transform 0.15s ease-in-out';
        cell.addEventListener('mouseover', function() {
          cell.style.transform = 'scale(1.2)';
        });
        cell.addEventListener('mouseout', function() {
          cell.style.transform = 'scale(1)';
        });
        
        gridContainer.appendChild(cell);
      }
    }
    
    containerElement.appendChild(gridContainer);
    
    // Add legend
    const legend = document.createElement('div');
    legend.style.display = 'flex';
    legend.style.alignItems = 'center';
    legend.style.justifyContent = 'flex-end';
    legend.style.marginTop = '10px';
    legend.style.gap = '5px';
    legend.style.fontSize = '12px';
    legend.style.color = '#adb5bd';
    
    // Add "Less" label
    const lessLabel = document.createElement('span');
    lessLabel.textContent = 'Less';
    legend.appendChild(lessLabel);
    
    // Add legend cells
    for (let i = 0; i <= 4; i++) {
      const legendCell = document.createElement('div');
      legendCell.style.width = '10px';
      legendCell.style.height = '10px';
      legendCell.style.backgroundColor = getCellColor(i);
      legendCell.style.borderRadius = '2px';
      legend.appendChild(legendCell);
    }
    
    // Add "More" label
    const moreLabel = document.createElement('span');
    moreLabel.textContent = 'More';
    legend.appendChild(moreLabel);
    
    containerElement.appendChild(legend);
  }
  
  function getCellColor(intensity) {
    // Use GitHub-style color palette but with purple theme
    const colors = [
      'rgba(98, 71, 170, 0.1)',  // Level 0 (empty)
      'rgba(98, 71, 170, 0.4)',  // Level 1
      'rgba(98, 71, 170, 0.6)',  // Level 2
      'rgba(98, 71, 170, 0.8)',  // Level 3
      'rgba(98, 71, 170, 1.0)',  // Level 4
    ];
    return colors[Math.floor(intensity)];
  }

  /**
   * Load Skills and GitHub Contributions
   */
  async function loadSkillsFromJSON() {
    try {
      // Load competence data from skill_competence.json with cache-busting
      const competenceResponse = await fetch(`skill_competence.json?v=${Date.now()}`);
      const competenceData = await competenceResponse.json();
      
      // Load GitHub contribution data from gh_contribution.json with cache-busting
      const contributionResponse = await fetch(`gh_contribution.json?v=${Date.now()}`);
      const contributionData = await contributionResponse.json();
      
      console.log('Loading competence from skill_competence.json...');
      console.log('Loading GitHub contributions from gh_contribution.json...');
      
      // Apply the competence percentages to the skills section
      updateSkillBars(competenceData.competence);
      
      // Create or update language contributions display from GitHub data
      updateLanguageContributions(contributionData.languages);
      
      console.log('Competence loaded successfully:', competenceData.competence);
      console.log('GitHub contributions loaded successfully:', contributionData.languages);
      
    } catch (error) {
      console.error('Error loading skills/contributions from JSON:', error);
      // Fallback to default percentages
      const fallbackCompetence = {
        'HTML': 95,
        'CSS': 88,
        'JavaScript': 82,
        'C++': 75,
        'Python': 70,
        'PHP': 65,
        'C': 60,
        'CMake': 45,
        'Shell': 55,
        'Photoshop': 55
      };
      console.log('Using fallback competence percentages...');
      updateSkillBars(fallbackCompetence);
    }
  }
  
  function updateSkillBars(percentages) {
    const skillsSection = document.querySelector('#skills');
    if (!skillsSection) return;
    
    // Update each skill bar
    Object.entries(percentages).forEach(([skillName, percentage]) => {
      // Find the skill element by text content
      const skillElements = skillsSection.querySelectorAll('.skill span');
      skillElements.forEach(skillElement => {
        if (skillElement.textContent.trim() === skillName) {
          // Update percentage display
          const valElement = skillElement.parentElement.querySelector('.val');
          if (valElement) {
            valElement.textContent = `${percentage}%`;
          }
          
          // Update progress bar
          const progressBar = skillElement.parentElement.parentElement.querySelector('.progress-bar');
          if (progressBar) {
            progressBar.setAttribute('aria-valuenow', percentage);
            // The animation will be triggered by the waypoint
          }
        }
      });
    });
  }

  function updateLanguageContributions(languages) {
    // Find or create the language contributions section
    let langSection = document.querySelector('#language-contributions');
    if (!langSection) {
      // Create the section after the skills section
      const skillsSection = document.querySelector('#skills');
      if (skillsSection) {
        langSection = document.createElement('div');
        langSection.id = 'language-contributions';
        langSection.className = 'container mt-4 mb-4';
        langSection.innerHTML = `
          <div class="language-stats" style="background: rgba(255, 255, 255, 0.1); border-radius: 8px; padding: 20px; margin-top: 20px; backdrop-filter: blur(3px); border: 1px solid rgba(255, 255, 255, 0.2);">
            <h6 style="margin-bottom: 15px; color: #f8f9fa; font-weight: 600;">Languages in Merged Contributions</h6>
            <div class="language-bar-container" style="display: flex; background: rgba(0, 0, 0, 0.4); border-radius: 6px; height: 8px; margin-bottom: 15px; overflow: hidden; width: 100%; border: 1px solid rgba(255, 255, 255, 0.1);">
            </div>
            <div class="language-list" style="display: flex; flex-wrap: wrap; gap: 15px;">
            </div>
          </div>
        `;
        skillsSection.parentNode.insertBefore(langSection, skillsSection.nextSibling);
      }
    }

    if (!langSection) return;

    const barContainer = langSection.querySelector('.language-bar-container');
    const listContainer = langSection.querySelector('.language-list');
    
    if (!barContainer || !listContainer) return;

    // Language colors (darker, muted versions for better contrast on dark background)
    const languageColors = {
      'C++': '#c75f7f',        // Muted pink
      'C': '#777777',          // Darker gray
      'CMake': '#b83434',      // Darker red
      'Python': '#2d5aa0',     // Darker blue
      'Shell': '#6ba83a',      // Darker green
      'Go': '#0088a8',         // Darker cyan
      'JavaScript': '#d1c040', // Muted yellow
      'HTML': '#c73e1d',       // Darker orange
      'CSS': '#1557a0',        // Darker blue
      'PHP': '#4a5d95',        // Darker purple
      'TypeScript': '#2d79c7', // Darker blue
      'Vue': '#35a371',        // Darker green
      'React': '#4a90c2',      // Darker blue
      'Java': '#a8762f',       // Muted brown
      'Rust': '#a0613e',       // Muted rust
      'Vala': '#6a4a9c',       // Darker violet
      'Perl': '#2e6b8a'        // Darker teal
    };

    // Create the language bar
    barContainer.innerHTML = ''; // Clear existing content
    Object.entries(languages).forEach(([lang, percentage]) => {
      const color = languageColors[lang] || '#858585';
      const segment = document.createElement('div');
      segment.style.cssText = `
        background-color: ${color};
        width: ${percentage}%;
        height: 100%;
        flex-shrink: 0;
      `;
      barContainer.appendChild(segment);
    });

    // Create the language list
    let listHTML = '';
    Object.entries(languages).forEach(([lang, percentage]) => {
      const color = languageColors[lang] || '#888888';
      listHTML += `
        <div style="display: flex; align-items: center; font-size: 14px;">
          <span style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; border: 1px solid rgba(255, 255, 255, 0.2);"></span>
          <span style="color: #f8f9fa; margin-right: 4px; font-weight: 500;">${lang}</span>
          <span style="color: #dee2e6;">${percentage}%</span>
        </div>
      `;
    });
    listContainer.innerHTML = listHTML;
  }

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);
  
  // Initialize skills loading
  window.addEventListener('load', () => {
    setTimeout(loadSkillsFromJSON, 1000); // Delay to ensure other scripts load first
  });

  /**
   * Education tutorials loader
   */
  async function loadEducationTutorials() {
    try {
      console.log('Loading education tutorials...');
      const response = await fetch(`education_tutorials.json?v=${Date.now()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Education data loaded:', data);
      
      const container = document.getElementById('tutorials-container');
      if (!container) {
        console.error('Tutorials container not found');
        return;
      }
      
      // Clear existing content
      container.innerHTML = '';
      
      if (!data.tutorials || data.tutorials.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center">No tutorials found</p></div>';
        return;
      }
      
      // Store all tutorials globally for filtering
      window.allTutorials = data.tutorials;
      
      // Create ALL tutorial cards
      data.tutorials.forEach(tutorial => {
        const tutorialCard = createTutorialCard(tutorial);
        container.appendChild(tutorialCard);
      });
      
      // Reinitialize Isotope after content is loaded
      setTimeout(() => {
        const isotopeContainer = document.querySelector('.isotope-layout .isotope-container');
        if (isotopeContainer && typeof Isotope !== 'undefined') {
          const iso = new Isotope(isotopeContainer, {
            itemSelector: '.isotope-item',
            layoutMode: 'masonry',
            filter: '.filter-cpp' // Default to showing C++ tutorials
          });
          
          // Update filter buttons functionality
          const filterButtons = document.querySelectorAll('.isotope-filters li');
          filterButtons.forEach(button => {
            button.addEventListener('click', function() {
              const filterValue = this.getAttribute('data-filter');
              
              // Update active class
              filterButtons.forEach(btn => btn.classList.remove('filter-active'));
              this.classList.add('filter-active');
              
              // Use Isotope's built-in filtering
              iso.arrange({ filter: filterValue });
            });
          });
          
          // Ensure C++ button is active by default
          const cppButton = document.querySelector('.isotope-filters li[data-filter=".filter-cpp"]');
          if (cppButton) {
            filterButtons.forEach(btn => btn.classList.remove('filter-active'));
            cppButton.classList.add('filter-active');
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('Error loading education tutorials:', error);
      const container = document.getElementById('tutorials-container');
      if (container) {
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error loading tutorials</p></div>';
      }
    }
  }

  function createTutorialCard(tutorial) {
    const div = document.createElement('div');
    div.className = `col-lg-4 col-md-6 isotope-item ${tutorial.category || 'filter-web'}`;
    
    const thumbnailUrl = tutorial.thumbnail || tutorial.image || 'assets/img/default-tutorial.jpg';
    const duration = tutorial.description || 'N/A';
    const instructor = tutorial.instructor || 'Unknown';
    const completed = tutorial.completed || 'N/A';
    const url = tutorial.url || '#';
    const title = tutorial.title || 'Untitled Tutorial';
    
    div.innerHTML = `
      <div class="portfolio-item">
        <img src="${thumbnailUrl}" class="img-fluid" alt="${title}" style="width: 100%; height: 200px; object-fit: cover;">
        <div class="portfolio-info">
          <h4>${title}</h4>
          <p><strong>Instructor:</strong> ${instructor}</p>
          <div class="tutorial-meta">
            <span class="duration"><i class="bi bi-book"></i> ${duration}</span>
            <span class="difficulty"><i class="bi bi-calendar-check"></i> ${completed}</span>
          </div>
          <a href="${url}" target="_blank" class="details-link" title="Watch Tutorial">
            <i class="bi bi-play-circle"></i> Watch Tutorial
          </a>
        </div>
      </div>
    `;
    
    return div;
  }

  // Initialize education tutorials loading
  document.addEventListener('DOMContentLoaded', function() {
    loadEducationTutorials();
  });

  /**
   * Pull Requests functionality
   */
  function escapeHTML(text) {
    var map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
  }

  async function loadPullRequests() {
    try {
      const response = await fetch(`pull_requests.json?v=${Date.now()}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const actualPRs = data.pull_requests.filter(pr => pr.state === 'merged' && pr.merged_at &&
        pr.number > 0 && pr.url.includes('/pull/') &&
        pr.repository.owner.toLowerCase() !== data.metadata.username.toLowerCase()
      ).sort((a, b) => b.merged_at.localeCompare(a.merged_at));
      
      document.getElementById('pr-loading').style.display = 'none';
      document.getElementById('pr-error').classList.remove('show');
      
      updatePRStats(data.metadata, actualPRs);
      
      createPRSlides(actualPRs);
      
      document.getElementById('pr-slider').style.display = 'block';
      
      initializePRSwiper();
      
    } catch (error) {
      console.error('Error loading pull requests:', error);
      document.getElementById('pr-loading').style.display = 'none';
      document.getElementById('pr-slider').style.display = 'none';
      document.getElementById('pr-error').classList.add('show');
    }
  }

  function updatePRStats(metadata, actualPRs) {
    document.getElementById('merged-prs').textContent = actualPRs.length;
    const repositories = new Map(actualPRs.map(pr => [pr.repository.full_name, pr.repository]));
    document.getElementById('unique-repos').textContent = repositories.size;
    document.getElementById('pr-stats').style.display = 'flex';
    document.getElementById('contributions-updated').textContent =
      `Verified on GitHub · Updated ${new Date(metadata.generated_at).toLocaleDateString(undefined, { timeZone: 'UTC' })}`;
    const projects = document.getElementById('accepted-projects');
    projects.replaceChildren();
    [...repositories].sort(([a], [b]) => a.localeCompare(b)).forEach(([name]) => {
      const link = document.createElement('a');
      link.className = 'btn btn-outline-light btn-sm project-link';
      link.href = `#project-${name.toLowerCase().replace('/', '--')}`;
      link.textContent = name;
      link.addEventListener('click', event => {
        event.preventDefault();
        loadProjectDetail(name.toLowerCase().replace('/', '--'));
      });
      projects.appendChild(link);
    });
  }

  function createPRSlides(actualPRs) {
    const slidesContainer = document.getElementById('pr-slides');
    slidesContainer.innerHTML = '';
    
    if (actualPRs.length === 0) {
      slidesContainer.innerHTML = '<div class="swiper-slide"><p class="text-center text-white">No accepted contributions found</p></div>';
      return;
    }
    
    actualPRs.forEach(pr => {
      const slide = document.createElement('div');
      slide.className = `swiper-slide pr-slide ${pr.state}`;
      
      const statusColor = '#28a745';
      
      // Truncate description to fit in allocated space
      const maxDescLength = 150;
      const truncatedDesc = (pr.description || 'No description provided.').length > maxDescLength 
        ? (pr.description || 'No description provided.').substring(0, maxDescLength) + '...'
        : (pr.description || 'No description provided.');
      
      // Get logo URL - prefer custom logo over owner avatar
      const logoUrl = pr.repository.logo?.social_image || pr.repository.logo?.owner_avatar || '';
      
      slide.innerHTML = `
        <div class="pr-card-wrapper" style="
          position: relative;
          background-color: rgba(30, 30, 40, 0.95);
          border-radius: 12px;
          overflow: hidden;
          height: 100%;
          min-height: 320px;
          backdrop-filter: blur(5px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        ">
          ${logoUrl ? `
          <div class="pr-logo-background" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-image: url('${logoUrl}');
            background-size: 140px 140px;
            background-repeat: no-repeat;
            background-position: center;
            opacity: 0.4;
            filter: blur(1px) grayscale(20%) brightness(1.3) contrast(0.8);
            z-index: 1;
            border-radius: 12px;
            backdrop-filter: blur(2px);
          "></div>
          ` : ''}
          
          <div class="pr-card-overlay" style="
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, 
              rgba(0, 0, 0, 0.3) 0%, 
              rgba(0, 0, 0, 0.6) 50%, 
              rgba(0, 0, 0, 0.8) 100%);
            z-index: 2;
          "></div>
          
          <div class="pr-card-content" style="
            position: relative;
            z-index: 3;
            padding: 20px;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          ">
            <div class="pr-card-header">
              <h4 class="pr-title" style="
                color: #ffffff;
                font-size: 16px;
                font-weight: 600;
                margin-bottom: 12px;
                line-height: 1.3;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
              ">${escapeHTML(pr.title)}</h4>
            </div>
            
            <div class="pr-meta" style="
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 12px;
              gap: 10px;
            ">
              <a href="${pr.repository.url}" class="pr-repo" target="_blank" style="
                color: #64b5f6;
                text-decoration: none;
                font-weight: 500;
                font-size: 14px;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
                flex: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              ">${escapeHTML(pr.repository.full_name || `${pr.repository.owner}/${pr.repository.name}`)}</a>
              <span class="pr-status ${pr.state}" style="
                background-color: ${statusColor};
                color: white;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 600;
                text-transform: capitalize;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
              ">${pr.state}</span>
            </div>
            
            <div class="pr-description-container" style="
              flex: 1;
              margin-bottom: 15px;
              min-height: 60px;
            ">
              <p class="pr-description" style="
                color: #e0e0e0;
                font-size: 13px;
                line-height: 1.4;
                margin: 0;
                text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
              ">${escapeHTML(truncatedDesc)}</p>
            </div>
            
            <div class="pr-stats-container" style="margin-bottom: 15px;">
              <div class="pr-stats" style="
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                font-size: 12px;
              ">
                <div class="pr-stat" style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  color: #b0b0b0;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 6px 8px;
                  border-radius: 6px;
                  backdrop-filter: blur(5px);
                ">
                  <i class="bi bi-git" style="color: #f39c12;"></i>
                  <span>${pr.commits_count} commits</span>
                </div>
                <div class="pr-stat" style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  color: #b0b0b0;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 6px 8px;
                  border-radius: 6px;
                  backdrop-filter: blur(5px);
                ">
                  <i class="bi bi-file-diff" style="color: #3498db;"></i>
                  <span>${pr.changed_files} files</span>
                </div>
                <div class="pr-stat" style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  color: #b0b0b0;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 6px 8px;
                  border-radius: 6px;
                  backdrop-filter: blur(5px);
                ">
                  <i class="bi bi-plus-square" style="color: #28a745;"></i>
                  <span>+${pr.additions}</span>
                </div>
                <div class="pr-stat" style="
                  display: flex;
                  align-items: center;
                  gap: 6px;
                  color: #b0b0b0;
                  background: rgba(255, 255, 255, 0.1);
                  padding: 6px 8px;
                  border-radius: 6px;
                  backdrop-filter: blur(5px);
                ">
                  <i class="bi bi-dash-square" style="color: #dc3545;"></i>
                  <span>-${pr.deletions}</span>
                </div>
              </div>
            </div>
            
            <p class="small text-light">Merged ${escapeHTML(pr.merged_at.slice(0, 10))} · #${pr.number}</p>
            <div class="pr-actions-container">
              <div class="pr-actions" style="
                display: flex;
                gap: 10px;
                justify-content: center;
              ">
                <a href="${pr.url}" class="pr-link primary" target="_blank" style="
                  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                  color: white;
                  text-decoration: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 600;
                  transition: all 0.3s ease;
                  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
                  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
                ">View PR</a>
                <a href="${pr.repository.url}" class="pr-link secondary" target="_blank" style="
                  background: rgba(255, 255, 255, 0.15);
                  color: #e0e0e0;
                  text-decoration: none;
                  padding: 8px 16px;
                  border-radius: 6px;
                  font-size: 12px;
                  font-weight: 600;
                  transition: all 0.3s ease;
                  border: 1px solid rgba(255, 255, 255, 0.2);
                  backdrop-filter: blur(5px);
                ">View Repo</a>
              </div>
            </div>
          </div>
        </div>
      `;
      
      slidesContainer.appendChild(slide);
    });
  }

  function initializePRSwiper() {
    new Swiper('#pr-slider', {
      loop: true,
      speed: 400,
      autoplay: {
        delay: 5000,
        disableOnInteraction: false,
      },
      slidesPerView: 1,
      spaceBetween: 20,
      centeredSlides: true,
      pagination: {
        el: '.swiper-pagination',
        clickable: true,
      },
      navigation: {
        nextEl: '.swiper-button-next',
        prevEl: '.swiper-button-prev',
      },
      breakpoints: {
        // For all mobile devices (up to 575px)
        0: {
          slidesPerView: 1,
          spaceBetween: 20,
          centeredSlides: true
        },
        // For larger mobile devices (576px to 767px)
        576: {
          slidesPerView: 1,
          spaceBetween: 20,
          centeredSlides: true
        },
        // For tablets (768px to 1199px)
        768: {
          slidesPerView: 2,
          spaceBetween: 20,
          centeredSlides: false
        },
        // For desktops (1200px and above)
        1200: {
          slidesPerView: 3,
          spaceBetween: 30,
          centeredSlides: true
        }
      }
    });
  }

  // Initialize pull requests loading
  document.addEventListener('DOMContentLoaded', function() {
    loadPullRequests();
  });

  /**
   * EmailJS Contact Form Handler
   */
  document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contact-form');
    
    if (contactForm) {
      // Remove any existing event listeners to prevent PHP form validation
      contactForm.removeEventListener('submit', function() {});
      
      contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        e.stopImmediatePropagation(); // Prevent PHP script from running
        
        // Show loading
        const loading = contactForm.querySelector('.loading');
        const errorMessage = contactForm.querySelector('.error-message');
        const sentMessage = contactForm.querySelector('.sent-message');
        
        // Reset messages - hide all first
        if (loading) loading.style.display = 'block';
        if (errorMessage) {
          errorMessage.style.display = 'none';
          errorMessage.classList.remove('d-block');
        }
        if (sentMessage) {
          sentMessage.style.display = 'none';
          sentMessage.classList.remove('d-block');
        }
        
        // Get form data and prepare custom message
        const formData = new FormData(contactForm);
        const senderName = formData.get('name') || 'Unknown';
        const senderEmail = formData.get('email') || 'No email provided';
        const subject = formData.get('subject') || 'No subject';
        const originalMessage = formData.get('message') || '';
        
        // Create enhanced message with sender info
        const enhancedMessage = `From: ${senderName} (${senderEmail})\n\n${originalMessage}`;
        
        // Prepare template parameters for EmailJS
        const templateParams = {
          from_name: senderName,
          from_email: senderEmail,
          subject: subject,
          message: enhancedMessage
        };
        
        // Send email using EmailJS with custom parameters
        emailjs.send('service_zxfay34', 'template_uioa4zg', templateParams)
          .then(function() {
            // Success
            if (loading) loading.style.display = 'none';
            if (sentMessage) {
              sentMessage.style.display = 'block';
              sentMessage.classList.add('d-block');
            }
            contactForm.reset();
            
            // Hide success message after 5 seconds
            setTimeout(function() {
              if (sentMessage) {
                sentMessage.style.display = 'none';
                sentMessage.classList.remove('d-block');
              }
            }, 5000);
          }, function(error) {
            // Error
            if (loading) loading.style.display = 'none';
            if (errorMessage) {
              errorMessage.style.display = 'block';
              errorMessage.classList.add('d-block');
              errorMessage.innerHTML = 'Failed to send message. Please try again later.';
            }
            console.log('EmailJS Error:', error);
          });
      }, true); // Use capture phase to run before PHP script
    }
  });

  /**
   * Auto-refresh functionality - Detects file changes and hard refreshes
   */
  let lastModified = new Map();
  let checkInterval = null;
  
  // Files to monitor for changes
  const filesToMonitor = [
    'assets/css/main.css',
    'assets/js/main.js',
    'index.html',
    'education_tutorials.json',
    'pull_requests.json',
    'skill_competence.json',
    'gh_contribution.json'
  ];
  
  async function checkFileChanges() {
    try {
      for (const file of filesToMonitor) {
        const response = await fetch(`${file}?t=${Date.now()}`, {
          method: 'HEAD',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const lastMod = response.headers.get('last-modified');
          const etag = response.headers.get('etag');
          const fileSignature = lastMod || etag || Date.now();
          
          if (lastModified.has(file)) {
            const previousSignature = lastModified.get(file);
            if (previousSignature !== fileSignature) {
              console.log(`File changed detected: ${file}`);
              
              // Show notification before refresh
              showRefreshNotification(file);
              
              // Hard refresh after short delay
              setTimeout(() => {
                window.location.reload(true);
              }, 1500);
              
              return; // Exit early on first change detected
            }
          }
          
          lastModified.set(file, fileSignature);
        }
      }
    } catch (error) {
      console.log('File change monitoring error (normal in production):', error.message);
    }
  }
  
  function showRefreshNotification(changedFile) {
    // Create or update notification
    let notification = document.getElementById('refresh-notification');
    if (!notification) {
      notification = document.createElement('div');
      notification.id = 'refresh-notification';
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        font-family: 'Poppins', sans-serif;
        font-size: 14px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        animation: slideInRight 0.3s ease-out;
        max-width: 300px;
      `;
      
      // Add animation styles
      if (!document.getElementById('refresh-notification-styles')) {
        const style = document.createElement('style');
        style.id = 'refresh-notification-styles';
        style.textContent = `
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(notification);
    }
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <i class="bi bi-arrow-clockwise" style="font-size: 16px; animation: spin 1s linear infinite;"></i>
        <div>
          <strong>File Updated!</strong><br>
          <small>${changedFile.split('/').pop()} has changed. Refreshing...</small>
        </div>
      </div>
    `;
    
    // Add spin animation for icon
    if (!document.getElementById('spin-animation-styles')) {
      const spinStyle = document.createElement('style');
      spinStyle.id = 'spin-animation-styles';
      spinStyle.textContent = `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(spinStyle);
    }
  }
  
  function startFileMonitoring() {
    // Only enable in development (when running locally)
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.hostname.includes('192.168.') ||
        window.location.protocol === 'file:') {
      
      console.log('🔄 Development mode: File change monitoring enabled');
      
      // Initial check to populate lastModified
      checkFileChanges();
      
      // Check every 2 seconds
      checkInterval = setInterval(checkFileChanges, 2000);
      
      // Optional: Add manual refresh button for development
      addManualRefreshButton();
    } else {
      console.log('📦 Production mode: File monitoring disabled');
    }
  }
  
  function addManualRefreshButton() {
    const refreshBtn = document.createElement('button');
    refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i>';
    refreshBtn.title = 'Force Refresh (Dev Mode)';
    refreshBtn.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      border: none;
      border-radius: 50%;
      width: 50px;
      height: 50px;
      cursor: pointer;
      z-index: 9999;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.2);
      font-size: 16px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    refreshBtn.addEventListener('mouseenter', () => {
      refreshBtn.style.background = 'rgba(0, 0, 0, 0.9)';
      refreshBtn.style.transform = 'scale(1.1)';
    });
    
    refreshBtn.addEventListener('mouseleave', () => {
      refreshBtn.style.background = 'rgba(0, 0, 0, 0.7)';
      refreshBtn.style.transform = 'scale(1)';
    });
    
    refreshBtn.addEventListener('click', () => {
      showRefreshNotification('Manual refresh');
      setTimeout(() => {
        window.location.reload(true);
      }, 500);
    });
    
    document.body.appendChild(refreshBtn);
  }
  
  // Start monitoring when page loads
  window.addEventListener('load', () => {
    setTimeout(startFileMonitoring, 1000); // Small delay to ensure everything is loaded
  });
  
  // Stop monitoring when page is about to unload
  window.addEventListener('beforeunload', () => {
    if (checkInterval) {
      clearInterval(checkInterval);
    }
  });

})();