// Client/js/myApplications.js

document.addEventListener('DOMContentLoaded', function () {
    const selectAllCheckbox = document.getElementById('select-all');
    const acceptSelectedButton = document.getElementById('accept-selected');
    const rejectSelectedButton = document.getElementById('reject-selected');
    const applicationsTbody = document.getElementById('applications-tbody');

    // Function to fetch applications from the server
    function fetchApplications() {
        // Clear existing rows and show loading indicator
        applicationsTbody.innerHTML = '<tr class="loading"><td colspan="6">Loading applications...</td></tr>';

        fetch('/api/professor/applications', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Error: ${response.status} ${response.statusText}`);
                }
                return response.json();
            })
            .then(data => {
                // Check if data is an array
                if (Array.isArray(data)) {
                    renderApplications(data);
                } else {
                    throw new Error('Invalid data format received from server.');
                }
            })
            .catch(error => {
                console.error('Error fetching applications:', error);
                applicationsTbody.innerHTML = `<tr><td colspan="6" style="color: red;">Failed to load applications. Please try again later.</td></tr>`;
            });
    }

    // Function to render applications into the table
    function renderApplications(applications) {
        // Clear existing rows
        applicationsTbody.innerHTML = '';

        if (applications.length === 0) {
            applicationsTbody.innerHTML = '<tr><td colspan="6">No applications found.</td></tr>';
            return;
        }

        applications.forEach(application => {
            const row = document.createElement('tr');

            // Checkbox Cell
            const checkboxCell = document.createElement('td');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.classList.add('select-application');
            checkbox.setAttribute('data-application-id', application._id);
            checkboxCell.appendChild(checkbox);
            row.appendChild(checkboxCell);

            // Applicant Username
            const usernameCell = document.createElement('td');
            usernameCell.textContent = application.student.username;
            row.appendChild(usernameCell);

            // Applicant Email
            const emailCell = document.createElement('td');
            emailCell.textContent = application.student.email;
            row.appendChild(emailCell);

            // Research Opportunity
            const opportunityCell = document.createElement('td');
            opportunityCell.textContent = application.opportunity.title;
            row.appendChild(opportunityCell);

            // CV Download Button
            const cvCell = document.createElement('td');
            const cvButton = document.createElement('button');
            cvButton.textContent = 'Download CV';
            cvButton.classList.add('download-cv-button');
            cvButton.addEventListener('click', function () {
                downloadCV(application._id, application.cv.filename);
            });
            cvCell.appendChild(cvButton);
            row.appendChild(cvCell);

            // Status
            const statusCell = document.createElement('td');
            statusCell.textContent = capitalizeFirstLetter(application.status);
            row.appendChild(statusCell);

            // Append the row to the table body
            applicationsTbody.appendChild(row);
        });

        // After rendering, re-query all checkboxes and attach event listeners
        const selectApplicationCheckboxes = document.querySelectorAll('.select-application');
        attachCheckboxListeners(selectApplicationCheckboxes);
        updateActionButtonsState(); // Update the state of action buttons
    }

    // Function to attach event listeners to application checkboxes
    function attachCheckboxListeners(checkboxes) {
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                const allChecked = Array.from(document.querySelectorAll('.select-application')).every(cb => cb.checked);
                const someChecked = Array.from(document.querySelectorAll('.select-application')).some(cb => cb.checked);
                if (allChecked) {
                    selectAllCheckbox.checked = true;
                    selectAllCheckbox.indeterminate = false;
                } else if (someChecked) {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = true;
                } else {
                    selectAllCheckbox.checked = false;
                    selectAllCheckbox.indeterminate = false;
                }
                updateActionButtonsState();
            });
        });
    }

    // Function to get selected application IDs
    function getSelectedApplicationIds() {
        const selected = [];
        const selectApplicationCheckboxes = document.querySelectorAll('.select-application');
        selectApplicationCheckboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selected.push(checkbox.getAttribute('data-application-id'));
            }
        });
        return selected;
    }

    // Function to update action buttons' disabled state
    function updateActionButtonsState() {
        const selectedCount = getSelectedApplicationIds().length;
        if (acceptSelectedButton && rejectSelectedButton) {
            acceptSelectedButton.disabled = selectedCount === 0;
            rejectSelectedButton.disabled = selectedCount === 0;
        }
    }

    // Handle "Select All" checkbox change
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            const isChecked = this.checked;
            const selectApplicationCheckboxes = document.querySelectorAll('.select-application');
            selectApplicationCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
            updateActionButtonsState();
        });
    }

    // Function to handle bulk decision
    function handleBulkDecision(decision) {
        const selectedIds = getSelectedApplicationIds();
        if (selectedIds.length === 0) {
            alert('Please select at least one application.');
            return;
        }

        // Confirmation prompt
        const confirmation = confirm(`Are you sure you want to ${decision} the selected application(s)?`);
        if (!confirmation) return;

        // Send request to the server
        fetch('/api/applications/bulk-decision', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`, // Include token if required
            },
            body: JSON.stringify({
                applicationIds: selectedIds,
                decision: decision, // 'accept' or 'reject'
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    alert(`Applications have been successfully ${decision}ed.`);
                    // Refresh the applications list to reflect updates
                    fetchApplications();
                } else {
                    alert(`Error: ${data.message}`);
                }
            })
            .catch(error => {
                console.error(`Error during bulk ${decision}:`, error);
                alert('An error occurred while processing your request. Please try again later.');
            });
    }

    // Function to handle CV download
    function downloadCV(applicationId, filename) {
        fetch(`/api/applications/${applicationId}/download-cv`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to download CV.');
                }
                return response.blob();
            })
            .then(blob => {
                // Create a link element, use it to download the blob, then remove it
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => {
                console.error('Error downloading CV:', error);
                alert('Failed to download CV. Please try again later.');
            });
    }

    // Handle "Accept Selected" button click
    if (acceptSelectedButton) {
        acceptSelectedButton.addEventListener('click', function () {
            handleBulkDecision('accept');
        });
    }

    // Handle "Reject Selected" button click
    if (rejectSelectedButton) {
        rejectSelectedButton.addEventListener('click', function () {
            handleBulkDecision('reject');
        });
    }

    // Utility function to capitalize the first letter
    function capitalizeFirstLetter(string) {
        return string.charAt(0).toUpperCase() + string.slice(1);
    }

    // Function to decode JWT and get payload
    function getJWTPayload(token) {
        try {
            const payload = token.split('.')[1];
            return JSON.parse(atob(payload));
        } catch (e) {
            console.error('Invalid JWT Token:', e);
            return null;
        }
    }

    // Function to get user role from JWT token
    function getUserRole() {
        const token = localStorage.getItem('token');
        if (!token) return null;
        const payload = getJWTPayload(token);
        return payload ? payload.role : null;
    }

    // Reusable function to decode JWT and retrieve user information
    function getUserFromToken() {
        const token = localStorage.getItem('token');
        if (!token) return null;

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload;
        } catch (e) {
            console.error('Error decoding token:', e);
            return null;
        }
    }

    // Hide Recommended Opportunities button if user is professor
    const userRole = getUserRole();
    // Hide Dropdown Menu if user is not logged in
    const user = getUserFromToken();
    if (!user) {
        const dropdownMenu = document.getElementById('dropdown-menu');
        if (dropdownMenu) {
            dropdownMenu.style.display = 'none';
        }
    } else {
        // Show Dropdown Menu if user is student or professor
        if (user.role === 'student' || user.role === 'professor') {
            const dropdownMenu = document.getElementById('dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.style.display = 'block';
            }

            // Show the appropriate "My Applications" link based on role
            if (user.role === 'student') {
                const studentApplicationsLink = document.getElementById('student-applications-link');
                if (studentApplicationsLink) {
                    studentApplicationsLink.style.display = 'block';
                }
            }

            if (user.role === 'professor') {
                const professorApplicationsLink = document.getElementById('professor-applications-link');
                if (professorApplicationsLink) {
                    professorApplicationsLink.style.display = 'block';
                }
            }
        } else {
            // If user has a role other than student or professor, hide the dropdown
            const dropdownMenu = document.getElementById('dropdown-menu');
            if (dropdownMenu) {
                dropdownMenu.style.display = 'none';
            }
        }
    }

    // Hide Recommended Opportunities button if user is not a student
    if (!user || user.role !== 'student') {
        const recommendedButton = document.getElementById('recommended-opportunities-button');
        if (recommendedButton) {
            recommendedButton.style.display = 'none';
        }
    }

    // Hide "My Applications" links if user does not have the respective role
    if (!user || user.role !== 'student') {
        const studentApplicationsLink = document.getElementById('student-applications-link');
        if (studentApplicationsLink) {
            studentApplicationsLink.style.display = 'none';
        }
    }

    if (!user || user.role !== 'professor') {
        const professorApplicationsLink = document.getElementById('professor-applications-link');
        if (professorApplicationsLink) {
            professorApplicationsLink.style.display = 'none';
        }
    }

    // *** Optional: Show Logout and Hide Login Buttons if User is Logged In ***
    if (user) {
        const logoutButton = document.querySelector('.logout_button');
        const loginButton = document.querySelector('.login_button');
        if (logoutButton) {
            logoutButton.style.display = 'inline-block';
        }
        if (loginButton && !loginButton.classList.contains('logout_button')) { // Ensure not to hide the logout button
            loginButton.style.display = 'none';
        }
    }


    // Fetch and render applications on page load
    fetchApplications();
});
