// Client/professorDashboard.js

document.addEventListener('DOMContentLoaded', function () {
    // Retrieve the JWT token from localStorage
    const token = localStorage.getItem('token');
    const user = getUserFromToken();

    // Debugging: Log the user object
    console.log('Authenticated User:', user);

    // Check if the user is authenticated and has the 'professor' role
    if (!token || !user || user.role.toLowerCase() !== 'professor') {
        alert('Access denied. Only professors can access this page.');
        window.location.href = 'researchIndex.html'; // Redirect to homepage or login page
        return;
    }

    // Select DOM elements
    const applicationsList = document.getElementById('applications-list');
    const cvModal = document.getElementById('cvModal');
    const closeModalButton = document.querySelector('.close-button');
    const cvIframe = document.getElementById('cv-iframe');

    /**
     * Fetch and display applications relevant to the professor
     */
    function loadApplications() {
        fetch('/api/professor/applications', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error fetching applications: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(applications => {
                // Clear any existing content
                applicationsList.innerHTML = '';

                if (applications.length === 0) {
                    applicationsList.innerHTML = '<p>No applications submitted yet.</p>';
                    return;
                }

                // Iterate through each application and create DOM elements
                applications.forEach(app => {
                    const appDiv = document.createElement('div');
                    appDiv.className = 'application-item';
                    appDiv.innerHTML = `
                    <h3>${app.opportunity.title} (${app.opportunity.department})</h3>
                    <p><strong>Student:</strong> ${app.student.username} (${app.student.email})</p>
                    <p><strong>Status:</strong> ${capitalizeFirstLetter(app.status)}</p>
                    <p><strong>Applied At:</strong> ${new Date(app.appliedAt).toLocaleString()}</p>
                    <button class="view-cv-button" data-filename="${app.cv.filename}">View CV</button>
                `;
                    applicationsList.appendChild(appDiv);
                });

                // Attach event listeners to "View CV" buttons
                const viewCvButtons = document.querySelectorAll('.view-cv-button');
                viewCvButtons.forEach(button => {
                    button.addEventListener('click', function () {
                        const filename = this.getAttribute('data-filename');
                        viewCV(filename);
                    });
                });
            })
            .catch(error => {
                console.error('Error fetching applications:', error);
                applicationsList.innerHTML = `<p class="error">Error loading applications: ${error.message}</p>`;
            });
    }

    /**
     * Display the CV in a modal window
     * @param {string} filename - The filename of the CV to view
     */
    function viewCV(filename) {
        // Construct the URL to fetch the CV
        const downloadUrl = `/download-cv/${filename}`;

        // Fetch the CV as a blob and display it in the iframe
        fetch(downloadUrl, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(data => { throw new Error(data.message || 'Error fetching CV'); });
                }
                return response.blob();
            })
            .then(blob => {
                const fileURL = URL.createObjectURL(blob);
                cvIframe.src = fileURL;
                cvModal.style.display = 'block';
            })
            .catch(error => {
                console.error('Error fetching CV:', error);
                alert(`Error fetching CV: ${error.message}`);
            });
    }

    /**
     * Close the CV modal
     */
    function closeModal() {
        cvModal.style.display = 'none';
        cvIframe.src = '';
    }

    /**
     * Capitalize the first letter of a string
     * @param {string} string - The string to capitalize
     * @returns {string} - The capitalized string
     */
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    /**
     * Retrieve and parse the user information from the JWT token
     * @returns {Object|null} - The user object or null if invalid
     */
    function getUserFromToken() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            // Validate essential fields
            if (!payload.userId || !payload.username || !payload.role) {
                console.warn('Token payload missing required fields.');
                return null;
            }
            return payload; // { userId, username, role, iat, exp }
        } catch (error) {
            console.error('Error decoding token:', error);
            return null;
        }
    }

    // Event listener to close the modal when the close button is clicked
    closeModalButton.addEventListener('click', closeModal);

    // Event listener to close the modal when clicking outside the modal content
    window.addEventListener('click', function (event) {
        if (event.target == cvModal) {
            closeModal();
        }
    });

    // Initial load of applications when the page is loaded
    loadApplications();
});
