// Client/auth.js

// Ensure getUserFromToken is globally accessible
function getUserFromToken() {
  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload; // { userId, username, role, iat, exp }
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
}

document.addEventListener('DOMContentLoaded', function () {
  // Function to display user-specific UI elements
  function displayUserUI() {
    const user = getUserFromToken();

    // Log the user object for debugging
    console.log('Authenticated User:', user);

    // Select all relevant UI elements
    const loginButtons = document.querySelectorAll('.login_button');
    const logoutButtons = document.querySelectorAll('.logout_button');
    const registerButtons = document.querySelectorAll('.register_button');
    const roleDisplayElements = document.querySelectorAll('.user_role');

    const postOpportunityMenus = document.querySelectorAll('.post_opportunity_menu');
    const myCVMenus = document.querySelectorAll('.my_cv_menu');
    const professorDashboardMenus = document.querySelectorAll('.professor_dashboard_menu'); // New selector

    if (user) {
      // User is logged in
      loginButtons.forEach(btn => btn.style.display = 'none');
      registerButtons.forEach(btn => btn.style.display = 'none');
      logoutButtons.forEach(btn => btn.style.display = 'block');

      // Display the user's role and username
      roleDisplayElements.forEach(el => {
        el.textContent = `Welcome, ${user.username} (${capitalizeFirstLetter(user.role)})`;
        el.style.display = 'block';
      });

      // Normalize role to lowercase for comparison
      const userRole = user.role.toLowerCase();

      if (userRole === 'professor') {
        // Show 'Post New Research Opportunity' menu item
        postOpportunityMenus.forEach(menu => {
          menu.style.display = 'block';
        });

        // Show 'Professor Dashboard' menu item
        professorDashboardMenus.forEach(menu => {
          menu.style.display = 'block';
        });

        // Hide 'My CV' menu item if it's not applicable
        myCVMenus.forEach(menu => {
          menu.style.display = 'none';
        });
      }


      if (userRole === 'student') {
        // Show 'My CV' menu item
        myCVMenus.forEach(menu => menu.style.display = 'block');

        // Hide 'Post New Research Opportunity' and 'Professor Dashboard' menu items
        postOpportunityMenus.forEach(menu => menu.style.display = 'none');
        professorDashboardMenus.forEach(menu => menu.style.display = 'none');
      }

    } else {
      // User is not logged in
      loginButtons.forEach(btn => btn.style.display = 'block');
      registerButtons.forEach(btn => btn.style.display = 'block');
      logoutButtons.forEach(btn => btn.style.display = 'none');
      roleDisplayElements.forEach(el => el.style.display = 'none');

      // Hide all role-specific menu items
      postOpportunityMenus.forEach(menu => menu.style.display = 'none');
      myCVMenus.forEach(menu => menu.style.display = 'none');
      professorDashboardMenus.forEach(menu => menu.style.display = 'none');
    }
  }

  // Helper function to capitalize the first letter
  function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }

  // Logout Function
  window.logout = function () {
    localStorage.removeItem('token');
    alert('Logged out successfully!');
    window.location.href = 'researchIndex.html';
  };

  displayUserUI(); // Call on page load
});
