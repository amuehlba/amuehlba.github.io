// ===== Configuration =====
const ORCID_ID = '0000-0002-5205-2174';

// ===== Navigation Toggle =====
document.addEventListener('DOMContentLoaded', () => {
    const navToggle = document.querySelector('.nav-toggle');
    const navMenu = document.querySelector('.nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking on a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // Set current year in footer
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Load publications
    loadPublications();
});

// ===== Smooth Scrolling =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const navHeight = document.querySelector('.navbar').offsetHeight;
            const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
        }
    });
});

// ===== Load Publications from ORCID =====
async function loadPublications() {
    const container = document.getElementById('publications-list');

    try {
        const response = await fetch(`https://pub.orcid.org/v3.0/${ORCID_ID}/works`, {
            headers: {
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch publications');
        }

        const data = await response.json();
        const publications = parsePublications(data);

        if (publications.length === 0) {
            container.innerHTML = '<p class="error-message">No publications found.</p>';
            return;
        }

        renderPublications(publications, container);
    } catch (error) {
        console.error('Error loading publications:', error);
        container.innerHTML = `
            <div class="error-message">
                <p>Unable to load publications automatically.</p>
                <p>Please visit my <a href="https://orcid.org/${ORCID_ID}" target="_blank" rel="noopener">ORCID profile</a> to see my publications.</p>
            </div>
        `;
    }
}

// ===== Parse ORCID Publications Data =====
function parsePublications(data) {
    const publications = [];

    if (!data.group) return publications;

    data.group.forEach(group => {
        const workSummary = group['work-summary']?.[0];
        if (!workSummary) return;

        const title = workSummary.title?.title?.value || 'Untitled';
        const year = workSummary['publication-date']?.year?.value || 'N/A';
        const journal = workSummary['journal-title']?.value || '';

        // Get DOI from external IDs
        let doi = null;
        const externalIds = workSummary['external-ids']?.['external-id'] || [];
        for (const extId of externalIds) {
            if (extId['external-id-type'] === 'doi') {
                doi = extId['external-id-value'];
                break;
            }
        }

        publications.push({
            title,
            year,
            journal,
            doi,
            type: workSummary.type || 'journal-article'
        });
    });

    // Sort by year (newest first)
    publications.sort((a, b) => {
        const yearA = parseInt(a.year) || 0;
        const yearB = parseInt(b.year) || 0;
        return yearB - yearA;
    });

    return publications;
}

// ===== Render Publications =====
function renderPublications(publications, container) {
    container.innerHTML = '';

    publications.forEach(pub => {
        const item = document.createElement('article');
        item.className = 'publication-item';

        const titleHtml = pub.doi
            ? `<a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener">${escapeHtml(pub.title)}</a>`
            : escapeHtml(pub.title);

        const linksHtml = pub.doi
            ? `<div class="publication-links">
                   <a href="https://doi.org/${pub.doi}" target="_blank" rel="noopener" class="publication-link">
                       View Paper →
                   </a>
               </div>`
            : '';

        item.innerHTML = `
            <span class="publication-year">${escapeHtml(pub.year)}</span>
            <h3 class="publication-title">${titleHtml}</h3>
            ${pub.journal ? `<p class="publication-journal">${escapeHtml(pub.journal)}</p>` : ''}
            ${linksHtml}
        `;

        container.appendChild(item);
    });
}

// ===== Utility: Escape HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
