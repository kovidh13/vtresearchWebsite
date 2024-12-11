// Client/app.js

document.addEventListener('DOMContentLoaded', function () {
  const applyButton = document.getElementById('apply-button');
  const uploadCvPrompt = document.getElementById('upload-cv-prompt');
  let selectedOpportunityId = null; // Store the selected opportunity ID

  // Function to display error messages
  function displayError(message) {
    const listContainer = document.getElementById('opportunities-list');
    if (listContainer) { // Check if the element exists
      listContainer.innerHTML = `<p class="error">${message}</p>`;
    } else {
      console.warn('Element with ID "opportunities-list" not found.');
    }
  }

  // Function to display the list of opportunities
  function displayOpportunityList(opportunities) {
    const listContainer = document.getElementById('opportunities-list');
    if (!listContainer) { // Check if the element exists
      return;
    }
    listContainer.innerHTML = ''; // Clear existing content

    opportunities.forEach(opportunity => {
      // Create the item div with class 'opportunity_item'
      const item = document.createElement('div');
      item.className = 'opportunity_item';

      // Create the title element
      const title = document.createElement('h3');
      title.className = 'opportunity_item_title';
      title.textContent = opportunity.title;

      // Add the professor name using 'postedBy.username'
      const professor = document.createElement('p');
      professor.className = 'opportunity_item_professor';
      professor.textContent = opportunity.postedBy && opportunity.postedBy.username
        ? `Professor: ${opportunity.postedBy.username}`
        : 'Professor: N/A';

      // Append title and professor to the item
      item.appendChild(title);
      item.appendChild(professor);

      // Add click event listener
      item.addEventListener('click', () => {
        // Remove active class from other items
        const items = document.querySelectorAll('.opportunity_item');
        items.forEach(i => i.classList.remove('active'));
        item.classList.add('active');

        // Display opportunity details
        displayOpportunityDetails(opportunity);
      });

      // Append item to the list container
      listContainer.appendChild(item);
    });
  }

  // Function to display opportunity details
  function displayOpportunityDetails(opportunity) {
    const detailTitle = document.getElementById('detail-title');
    const detailDescription = document.getElementById('detail-description');
    const detailProfessor = document.getElementById('detail-professor');
    const detailDepartment = document.getElementById('detail-department');

    if (detailTitle && detailDescription && detailProfessor && detailDepartment) { // Check if elements exist
      detailTitle.textContent = opportunity.title;
      detailDescription.textContent = opportunity.fullDescription || opportunity.description || 'No description available.';
      detailProfessor.textContent = opportunity.postedBy && opportunity.postedBy.username
        ? `Professor: ${opportunity.postedBy.username}`
        : 'Professor: N/A';
      detailDepartment.textContent = opportunity.department
        ? `Department: ${opportunity.department}`
        : 'Department: N/A';
    }

    selectedOpportunityId = opportunity._id; // Store the selected opportunity ID

    // Check if the user is logged in and is a student
    const user = getUserFromToken();
    if (user && user.role === 'student') {
      checkCvAvailability().then(hasCV => {
        if (applyButton && uploadCvPrompt) { // Check if elements exist
          if (hasCV) {
            applyButton.style.display = 'block';
            uploadCvPrompt.style.display = 'none';
          } else {
            applyButton.style.display = 'none';
            uploadCvPrompt.style.display = 'block';
          }
        }
      });
    } else {
      if (applyButton && uploadCvPrompt) { // Check if elements exist
        applyButton.style.display = 'none';
        uploadCvPrompt.style.display = 'none';
      }
    }
  }

  // Function to fetch and display opportunities
  function fetchOpportunities() {
    fetch('/api/opportunities', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          displayOpportunityList(data);

          // Optionally, display the first opportunity's details by default
          if (data.length > 0) {
            displayOpportunityDetails(data[0]);

            // Set the first item as active
            const firstItem = document.querySelector('.opportunity_item');
            if (firstItem) {
              firstItem.classList.add('active');
            }
          } else {
            displayError('No research opportunities available at the moment.');
          }
        } else {
          throw new Error('Invalid data format received from server.');
        }
      })
      .catch(error => {
        console.error('Error fetching opportunities:', error);
        displayError('Failed to load research opportunities. Please try again later.');
      });
  }


  // Function to check CV availability for the logged-in student
  function checkCvAvailability() {
    const token = localStorage.getItem('token');
    return fetch('/api/my-cvs', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`Failed to fetch CVs (${response.status})`);
        }
        return response.json();
      })
      .then(cvs => {
        return cvs.length > 0;
      })
      .catch(error => {
        console.error('Error checking CVs:', error);
        return false;
      });
  }

  // Fetch and Display Student Applications ***
  function fetchStudentApplications() {
    const token = localStorage.getItem('token');
    if (!token) {
      // If not logged in, redirect to login page
      window.location.href = 'login.html';
      return;
    }

    fetch('/api/student/applications', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    })
      .then(response => {
        if (response.status === 401) {
          // Unauthorized, redirect to login
          window.location.href = 'login.html';
          throw new Error('Unauthorized');
        }
        if (!response.ok) {
          throw new Error(`Network response was not ok (${response.status})`);
        }
        return response.json();
      })
      .then(data => {
        if (data.applications && data.applications.length > 0) {
          displayStudentApplications(data.applications);
        } else {
          displayNoApplications();
        }
      })
      .catch(error => {
        console.error('Error fetching student applications:', error);
        displayError('Failed to load your applications. Please try again later.');
      });
  }

  function displayStudentApplications(applications) {
    const applicationsList = document.getElementById('applications-list');
    applicationsList.innerHTML = ''; // Clear existing content

    applications.forEach(app => {
      // Create a container for each application
      const appContainer = document.createElement('div');
      appContainer.className = 'application_item';

      // Application Details
      const appTitle = document.createElement('h3');
      appTitle.textContent = app.opportunity.title;

      const appDepartment = document.createElement('p');
      appDepartment.textContent = `Department: ${app.opportunity.department}`;

      const appStatus = document.createElement('p');
      appStatus.textContent = `Status: ${capitalizeFirstLetter(app.status)}`;
      appStatus.className = `status ${app.status}`; // For styling based on status

      const appliedAt = document.createElement('p');
      const date = new Date(app.appliedAt);
      appliedAt.textContent = `Applied On: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

      // Append details to the container
      appContainer.appendChild(appTitle);
      appContainer.appendChild(appDepartment);
      appContainer.appendChild(appStatus);
      appContainer.appendChild(appliedAt);

      // Append the application container to the list
      applicationsList.appendChild(appContainer);
    });
  }

  function displayNoApplications() {
    const applicationsList = document.getElementById('applications-list');
    applicationsList.innerHTML = '<p>You have not applied to any research opportunities yet.</p>';
  }

  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // *** Check if current page is 'applications.html' ***
  if (window.location.pathname.endsWith('applications.html')) {
    fetchStudentApplications();
  }

  // Event listener for the Apply button
  if (applyButton) {
    applyButton.addEventListener('click', function () {
      // Ensure the user is logged in
      const token = localStorage.getItem('token');
      const user = getUserFromToken();

      if (!token || !user || user.role !== 'student') {
        alert('You must be logged in as a student to apply.');
        return;
      }

      // Send the application request to the server
      fetch(`/api/opportunities/${selectedOpportunityId}/apply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
        .then(response => response.json())
        .then(data => {
          if (data.message === 'Application submitted successfully') {
            alert('Application submitted successfully!');
          } else {
            alert(`Error: ${data.message}`);
          }
        })
        .catch(error => {
          console.error('Error submitting application:', error);
          alert('An error occurred. Please try again later.');
        });
    });
  }

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

  // Fetch opportunities on page load
  fetchOpportunities();
});

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

// Navigation function
function navigateToRecommended() {
  window.location.href = 'recommendedOpportunities.html';
}
