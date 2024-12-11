// Client/postOpportunity.js

document.addEventListener('DOMContentLoaded', function () {
  // Ensure the user is a professor
  const token = localStorage.getItem('token');
  if (!token) {
    alert('You must be logged in to access this page.');
    window.location.href = 'login.html';
    return;
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

  // Handle form submission
  const form = document.getElementById('post-opportunity-form');
  form.addEventListener('submit', async function (event) {
    event.preventDefault();

    const title = document.getElementById('opportunity-title').value.trim();
    const description = document.getElementById('opportunity-description').value.trim();
    const fullDescription = document.getElementById('opportunity-full-description').value.trim();
    const department = document.getElementById('opportunity-department').value.trim();

    const messageDiv = document.getElementById('post-opportunity-message');
    messageDiv.innerHTML = '';

    // Basic validation
    if (!title || !description || !fullDescription || !department) {
      messageDiv.innerHTML = '<p class="error">All fields are required.</p>';
      return;
    }

    try {
      const response = await fetch('/api/opportunities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`, // Include the JWT token
        },
        body: JSON.stringify({ title, description, fullDescription, department }),
      });

      const data = await response.json();

      if (response.ok) {
        messageDiv.innerHTML = '<p class="success">Opportunity posted successfully! Redirecting...</p>';
        // Redirect to the index page after a short delay
        setTimeout(() => {
          window.location.href = 'researchIndex.html';
        }, 2000);
      } else {
        messageDiv.innerHTML = `<p class="error">${data.message}</p>`;
      }
    } catch (error) {
      console.error('Error posting opportunity:', error);
      messageDiv.innerHTML = '<p class="error">An error occurred. Please try again later.</p>';
    }
  });
});
