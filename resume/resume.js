// Resume JavaScript - Populate data from JSON files

/**
 * Construction Notice - Auto-push content down using document flow
 */
function createConstructionNotice() {
    // Create construction bar - no positioning, pure document flow
    const constructionBar = document.createElement('div');
    constructionBar.className = 'construction-notice-flow';
    constructionBar.innerHTML = `
      <i class="fas fa-tools"></i>
      <span>This website is under construction - Some features may be incomplete</span>
      <i class="fas fa-hard-hat"></i>
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

let resumeReady = false;
let resumeLoadPromise = null;

function readPreference(key) {
    try { return localStorage.getItem(key); } catch { return null; }
}

function savePreference(key, value) {
    try { localStorage.setItem(key, value); } catch { /* Storage is optional. */ }
}

async function fetchResumeJSON(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch(url, { signal: controller.signal, cache: 'no-cache' });
        if (!response.ok) throw new Error(`Unable to load ${url} (${response.status})`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
}

function setResumeControls(busy) {
    document.getElementById('downloadPdfButton').disabled = busy;
    document.getElementById('resumeTypeSelect').disabled = busy;
    document.getElementById('themeSelect').disabled = busy;
}

function reloadResume() {
    if (resumeLoadPromise) return resumeLoadPromise;
    resumeReady = false;
    setResumeControls(true);
    document.getElementById('downloadPdfLabel').textContent = 'Loading résumé…';
    document.getElementById('pdfStatus').textContent = '';
    resumeLoadPromise = (async () => {
        try {
            if (!window.resumeConfig) await initializeResumeTypeSystem();
            const results = await Promise.allSettled([
                loadContact(), loadSkills(), loadProjects(), loadPullRequests(),
                loadEducation(), loadProgrammingJourney(), loadReferences()
            ]);
            const failure = results.find(result => result.status === 'rejected');
            if (failure) throw failure.reason;
            resumeReady = true;
        } catch (error) {
            console.error('Unable to load complete résumé:', error);
            document.getElementById('pdfStatus').textContent =
                'The résumé could not fully load. Check your connection and select Retry PDF download.';
        } finally {
            resumeLoadPromise = null;
            setResumeControls(false);
            document.getElementById('downloadPdfLabel').textContent = resumeReady ? 'Download PDF' : 'Retry PDF download';
        }
        return resumeReady;
    })();
    return resumeLoadPromise;
}

document.addEventListener('DOMContentLoaded', function() {
    createConstructionNotice();
    initializeThemeSystem();
    reloadResume();
});

/**
 * Initialize the resume type selection system
 */
async function initializeResumeTypeSystem() {
    // Load resume configuration
    const config = await fetchResumeJSON('resume_data/resume_config.json');
    
    // Store config globally for use in other functions
    window.resumeConfig = config;
    
    // Populate the dropdown
    const select = document.getElementById('resumeTypeSelect');
    const resumeTypes = config.resumeTypes;
    
    // Clear existing options
    select.innerHTML = '';
    
    // Add options for each resume type
    Object.keys(resumeTypes).forEach(key => {
        const option = document.createElement('option');
        option.value = key;
        option.textContent = resumeTypes[key].label;
        option.setAttribute('data-description', resumeTypes[key].description);
        select.appendChild(option);
    });
    
    // Load saved resume type or use default
    const preference = readPreference('selectedResumeType');
    const savedResumeType = Object.hasOwn(resumeTypes, preference) ? preference : config.defaultResume;
    select.value = savedResumeType;
    
    // Set current resume type
    window.currentResumeType = savedResumeType;
    
    // Update section titles for the initial load
    updateSectionTitles(savedResumeType);
    
    console.log('Resume type system initialized:', savedResumeType);
    
}

/**
 * Update section titles based on resume type
 */
function updateSectionTitles(resumeType) {
    if (!window.resumeConfig || !window.resumeConfig.resumeTypes[resumeType]) {
        return;
    }
    
    const sectionTitles = window.resumeConfig.resumeTypes[resumeType].sectionTitles;
    
    if (sectionTitles) {
        // Update contributions section title
        const contributionsTitle = document.getElementById('contributions-title');
        if (contributionsTitle && sectionTitles.contributions) {
            contributionsTitle.textContent = sectionTitles.contributions;
        }
        
        // Update timeline section title
        const timelineTitle = document.getElementById('timeline-title');
        if (timelineTitle && sectionTitles.timeline) {
            timelineTitle.textContent = sectionTitles.timeline;
        }
    }
}

/**
 * Change resume type and reload data
 */
async function changeResumeType() {
    if (resumeLoadPromise || pdfExportInProgress) return;
    const selectedType = document.getElementById('resumeTypeSelect').value;
    if (!window.resumeConfig?.resumeTypes[selectedType]) return;
    window.currentResumeType = selectedType;
    savePreference('selectedResumeType', selectedType);
    updateSectionTitles(selectedType);
    await reloadResume();
}

/**
 * Load and display contact information
 */
async function loadContact() {
    const resumeType = window.currentResumeType || 'software-development';
    const data = await fetchResumeJSON(`resume_data/${resumeType}/contact.json`);
    
    // Update professional title
    const titleElement = document.getElementById('professional-title');
    if (titleElement && data.title) {
        titleElement.textContent = data.title;
    }
    
    // You can add more contact information updates here if needed
    // For example, updating email, phone, location, etc. if they have IDs
    
}

/**
 * Initialize the color theme system
 */
function initializeThemeSystem() {
    const themeSelect = document.getElementById('themeSelect');
    const body = document.body;
    
    // Load saved theme from localStorage
    const savedTheme = readPreference('resumeTheme') || 'original';
    themeSelect.value = savedTheme;
    
    // Apply the saved theme
    body.setAttribute('data-theme', savedTheme);
    
    // Add event listener for theme changes
    themeSelect.addEventListener('change', function(e) {
        const selectedTheme = e.target.value;
        
        // Apply new theme
        body.setAttribute('data-theme', selectedTheme);
        
        // Save theme preference
        savePreference('resumeTheme', selectedTheme);
    });
}

/**
 * Go back to the main portfolio site
 */
function goBackToPortfolio() {
    // Simple relative navigation to parent directory
    window.location.href = '../';
}

/**
 * Load and display skills from JSON
 */
async function loadSkills() {
    const resumeType = window.currentResumeType || 'software-development';
    const data = await fetchResumeJSON(`resume_data/${resumeType}/skills.json`);
    
    const skillsGrid = document.getElementById('skills-grid');
    
    let skillEntries = [];
    
    // Handle both old format (data.skills) and new format (data.languages[])
    if (data.skills) {
        // Old format: { "skills": { "HTML": 95, "CSS": 88, ... } }
        skillEntries = Object.entries(data.skills)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    } else if (data.languages && data.languages.length > 0) {
        // New format: { "languages": [{ "category": "...", "skills": [...] }] }
        const allSkills = [];
        data.languages.forEach(category => {
            if (category.skills) {
                category.skills.forEach(skill => {
                    allSkills.push([skill.name, skill.level]);
                });
            }
        });
        skillEntries = allSkills
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
    }
    
    if (skillEntries.length === 0) {
        // Fallback if no skills found
        skillEntries = [
            ['No skills data', 0]
        ];
    }
    
    skillsGrid.innerHTML = skillEntries.map(([skill, level]) => `
        <div class="skill-item">
            <span class="skill-name">${skill}</span>
            <span class="skill-level">${level}%</span>
        </div>
    `).join('');
    
}

/**
 * Load and display featured projects
 */
async function loadProjects() {
    const resumeType = window.currentResumeType || 'software-development';
    const projects = await fetchResumeJSON(resumeType === 'software-development'
        ? '../projects.json' : `resume_data/${resumeType}/projects.json`);
    
    const projectsContainer = document.getElementById('projects-container');
    
    // Show only top 2 featured projects in the same row
    const featuredProjects = projects.filter(p => p.featured).slice(0, 2);
    const otherProjects = projects.filter(p => !p.featured).slice(0, 2);
    const displayProjects = featuredProjects.length >= 2 ? featuredProjects : [...featuredProjects, ...otherProjects].slice(0, 2);
    
    projectsContainer.innerHTML = displayProjects.map(project => `
        <div class="project-item">
            <div class="project-header">
                <h4 class="project-title">${escapeResumeHTML(project.title || project.name)}</h4>
                <span class="project-status status-${project.status}">${escapeResumeHTML(project.status.replace('-', ' '))}</span>
            </div>
            <p class="project-description">${escapeResumeHTML(project.description || "")}</p>
            <div class="project-technologies">
                ${project.technologies.slice(0, 6).map(tech => 
                    `<span class="tech-tag">${tech}</span>`
                ).join('')}
            </div>
        </div>
    `).join('');
    
}

/**
 * Load and display pull request statistics and featured PRs
 */
async function loadPullRequests() {
    const data = await fetchResumeJSON('../pull_requests.json');
    const prs = data.pull_requests.filter(pr => pr.state === 'merged' && pr.merged_at &&
        pr.number > 0 && pr.repository.owner.toLowerCase() !== data.metadata.username.toLowerCase());
    document.getElementById('contributions-title').textContent = 'Accepted Open Source Contributions';
    document.getElementById('opensource-stats').innerHTML = `
        <div class="stat-item"><span class="stat-number">${prs.length}</span><span class="stat-label">Merged Pull Requests</span></div>
        <div class="stat-item"><span class="stat-number">${new Set(prs.map(pr => pr.repository.full_name)).size}</span><span class="stat-label">Upstream Projects</span></div>`;
    document.getElementById('featured-prs').innerHTML = prs.slice(0, 3).map(pr => `
        <div class="pr-item">
            <a class="pr-title" href="${escapeResumeHTML(pr.url)}">${escapeResumeHTML(pr.title)}</a>
            <div class="pr-repo">${escapeResumeHTML(pr.repository.full_name)}</div>
            <div class="pr-stats"><span class="pr-stat">Merged ${escapeResumeHTML(pr.merged_at.slice(0, 10))}</span></div>
        </div>`).join('');
}

function escapeResumeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
}

/**
 * Load and display education/tutorials
 */
async function loadEducation() {
    const resumeType = window.currentResumeType || 'software-development';
    const data = await fetchResumeJSON(`resume_data/${resumeType}/education.json`);
    
    const educationContainer = document.getElementById('education-container');
    
    // Show completed tutorials (limit to 8 for resume - 4 per row, 2 rows)
    const tutorials = Array.isArray(data) ? data.map(item => ({
        title: item.degree || item.title,
        completed: item.graduationDate || 'Ongoing',
        instructor: item.institution || '',
        description: item.field || item.description || ''
    })) : data.tutorials;
    const completedTutorials = tutorials
        .filter(tutorial => tutorial.completed && tutorial.completed !== 'N/A')
        .sort((a, b) => new Date(b.completed) - new Date(a.completed))
        .slice(0, 8);
    
    educationContainer.innerHTML = completedTutorials.map(tutorial => `
        <div class="education-item">
            <div class="education-header">
                <h4 class="education-title">${tutorial.title}</h4>
                <span class="education-date">${tutorial.completed}</span>
            </div>
            <div class="education-instructor">Instructor: ${tutorial.instructor}</div>
            <div class="education-description">${truncateText(tutorial.description || 'Professional development course', 100)}</div>
        </div>
    `).join('');
    
}

/**
 * Load and display programming journey timeline
 */
async function loadProgrammingJourney() {
    // Try to load from a programming journey JSON file
    const resumeType = window.currentResumeType || 'software-development';
    const data = await fetchResumeJSON(`resume_data/${resumeType}/programming-journey.json`);
    
    const journeyContainer = document.getElementById('journey-timeline');
    
    journeyContainer.innerHTML = data.slice(0, 4).map(milestone => `
        <div class="journey-item">
            <div class="journey-year">${milestone.year}</div>
            <div class="journey-milestone">${milestone.title}</div>
            <div class="journey-description">${milestone.description}</div>
        </div>
    `).join('');
    
}

/**
 * Utility function to truncate text
 */
function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Print functionality
 */
function printResume() {
    window.print();
}

// Add print button functionality if needed
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        printResume();
    }
});

// Add subtle loading states
function showLoading(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = '<div style="text-align: center; padding: 20px; color: #7f8c8d;">Loading...</div>';
    }
}

/**
 * Load and display references
 */
async function loadReferences() {
    const resumeType = window.currentResumeType || 'software-development';
    const references = await fetchResumeJSON(`resume_data/${resumeType}/references.json`);
    
    const referencesContainer = document.getElementById('references-grid');
    
    referencesContainer.innerHTML = references.map(reference => `
        <div class="reference-item">
            <div class="reference-name">${reference.name}</div>
            <div class="reference-title">${reference.title}</div>
            <div class="reference-company">${reference.company}</div>
            <div class="reference-contact">📧 ${reference.email}</div>
            <div class="reference-contact">📞 ${reference.phone}</div>
            <div class="reference-relationship">${reference.relationship}</div>
            <div class="reference-description">${reference.description || ""}</div>
        </div>
    `).join('');
    
}

// Show loading states initially
showLoading('skills-grid');
showLoading('projects-container');
showLoading('opensource-stats');
showLoading('education-container');
showLoading('journey-timeline');
showLoading('references-grid');
